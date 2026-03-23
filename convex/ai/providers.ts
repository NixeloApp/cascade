/// <reference types="node" />

/**
 * AI Provider Abstraction Layer
 * Unified interface for Anthropic Claude and OpenAI.
 * Supports runtime fallback: if the primary provider fails with a
 * transient error (5xx, timeout, rate-limit), the secondary provider
 * is tried before surfacing the error.
 */

import { ConvexError } from "convex/values";
import { validation } from "../lib/errors";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { MINUTE } from "../lib/timeUtils";
import type { AIConfig } from "./config";
import { getAIConfig, getFallbackAIConfig } from "./config";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Classify whether an error is transient (worth retrying with fallback)
 * or permanent (caller input error, auth failure).
 */
function isTransientError(error: unknown): boolean {
  // ConvexError validation errors are permanent (bad input, auth)
  if (error instanceof ConvexError) return false;

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Timeouts and network errors are transient
    if (msg.includes("timeout") || msg.includes("fetch failed") || msg.includes("econnrefused"))
      return true;
    // Rate limits are transient
    if (msg.includes("rate") && msg.includes("limit")) return true;
    if (msg.includes("429")) return true;
    // Server errors (5xx) are transient
    if (msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("504"))
      return true;
    // "overloaded" is transient (Anthropic specific)
    if (msg.includes("overloaded")) return true;
  }

  return false;
}

/**
 * Anthropic Claude provider
 */
async function callAnthropic(config: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  const response = await fetchWithTimeout(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.filter((m) => m.role !== "system"),
        system: messages.find((m) => m.role === "system")?.content,
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature || 0.7,
      }),
    },
    MINUTE,
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content[0].text,
    provider: "anthropic",
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

/**
 * OpenAI provider (GPT-4o, GPT-4o-mini, etc.)
 */
async function callOpenAI(config: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  const response = await fetchWithTimeout(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature || 0.7,
      }),
    },
    MINUTE,
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice?.message?.content) {
    throw validation("openai", "OpenAI returned empty response");
  }

  return {
    content: choice.message.content,
    provider: "openai",
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/** Route to the correct provider */
function callProvider(config: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  switch (config.provider) {
    case "anthropic":
      return callAnthropic(config, messages);
    case "openai":
      return callOpenAI(config, messages);
    default:
      throw validation("provider", `Unsupported AI provider: ${config.provider}`);
  }
}

/**
 * Main AI call function with runtime fallback.
 *
 * 1. Tries the primary provider (from getAIConfig).
 * 2. If it fails with a transient error AND a fallback provider is
 *    configured, retries with the fallback.
 * 3. If the fallback also fails, throws the fallback error.
 * 4. Permanent errors (auth, validation) are never retried.
 */
export async function callAI(config: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  try {
    return await callProvider(config, messages);
  } catch (primaryError) {
    // Only attempt fallback for transient errors
    if (!isTransientError(primaryError)) throw primaryError;

    const fallback = getFallbackAIConfig(config.provider);
    if (!fallback) throw primaryError; // No fallback configured

    console.warn(
      `[AI Fallback] Primary provider ${config.provider} failed, trying ${fallback.provider}`,
    );

    return await callProvider(fallback, messages);
  }
}
