/// <reference types="node" />

/**
 * AI Provider Abstraction Layer
 * Unified interface for Anthropic Claude
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
 * Main AI call function - routes to Anthropic
 */
export async function callAI(config: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  if (config.provider !== "anthropic") {
    throw validation(
      "provider",
      `Unsupported AI provider: ${config.provider}. Only Anthropic is supported.`,
    );
  }
  return await callAnthropic(config, messages);
}
