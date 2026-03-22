/// <reference types="node" />

/**
 * AI Provider Abstraction Layer
 * Unified interface for Anthropic Claude and OpenAI
 */

import { validation } from "../lib/errors";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { MINUTE } from "../lib/timeUtils";
import type { AIConfig } from "./config";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
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
    throw validation("anthropic", `Anthropic API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content[0].text,
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
    throw validation("openai", `OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice?.message?.content) {
    throw validation("openai", "OpenAI returned empty response");
  }

  return {
    content: choice.message.content,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Main AI call function — routes to the configured provider
 */
export async function callAI(config: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  switch (config.provider) {
    case "anthropic":
      return callAnthropic(config, messages);
    case "openai":
      return callOpenAI(config, messages);
    default:
      throw validation("provider", `Unsupported AI provider: ${config.provider}`);
  }
}
