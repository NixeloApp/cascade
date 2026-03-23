/**
 * AI Provider Configuration
 * Supports Anthropic Claude and OpenAI GPT
 * Provider is determined by which API key is configured
 */

import { getAnthropicApiKey, getAnthropicModel, isAnthropicConfigured } from "../lib/env";
import { validation } from "../lib/errors";

export type AIProvider = "anthropic" | "openai";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Claude models (using aliases — auto-point to latest snapshot)
 */
export const CLAUDE_MODELS = {
  opus: "claude-opus-4-5",
  haiku: "claude-haiku-4-5",
} as const;

/**
 * OpenAI models
 */
export const OPENAI_MODELS = {
  gpt4o: "gpt-4o",
  gpt4oMini: "gpt-4o-mini",
} as const;

/**
 * Default model for each use case
 */
export const DEFAULT_MODELS = {
  chat: CLAUDE_MODELS.opus,
  suggestions: CLAUDE_MODELS.haiku,
  summary: CLAUDE_MODELS.opus,
} as const;

function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || OPENAI_MODELS.gpt4o;
}

function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get AI configuration from environment variables.
 * Prefers Anthropic if both are configured.
 * Falls back to OpenAI if Anthropic is not available.
 */
export function getAIConfig(): AIConfig {
  // Prefer Anthropic
  if (isAnthropicConfigured()) {
    return {
      provider: "anthropic",
      apiKey: getAnthropicApiKey(),
      model: getAnthropicModel(),
      temperature: 0.7,
      maxTokens: 4096,
    };
  }

  // Fallback to OpenAI
  if (isOpenAIConfigured()) {
    return {
      provider: "openai",
      apiKey: getOpenAIApiKey() as string,
      model: getOpenAIModel(),
      temperature: 0.7,
      maxTokens: 4096,
    };
  }

  throw validation(
    "AI_API_KEY",
    "No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in environment variables.",
  );
}

/**
 * Get fallback AI config when the primary provider fails.
 * Returns the other provider if configured, or null if only one is available.
 */
export function getFallbackAIConfig(failedProvider: AIProvider): AIConfig | null {
  if (failedProvider === "anthropic" && isOpenAIConfigured()) {
    return {
      provider: "openai",
      apiKey: getOpenAIApiKey() as string,
      model: getOpenAIModel(),
      temperature: 0.7,
      maxTokens: 4096,
    };
  }
  if (failedProvider === "openai" && isAnthropicConfigured()) {
    return {
      provider: "anthropic",
      apiKey: getAnthropicApiKey(),
      model: getAnthropicModel(),
      temperature: 0.7,
      maxTokens: 4096,
    };
  }
  return null;
}

/**
 * Check if any AI provider is configured
 */
export function isAIConfigured(): boolean {
  return isAnthropicConfigured() || isOpenAIConfigured();
}

/**
 * Get the active provider name for display
 */
export function getActiveProviderName(): string | null {
  if (isAnthropicConfigured()) return "Anthropic Claude";
  if (isOpenAIConfigured()) return "OpenAI GPT";
  return null;
}
