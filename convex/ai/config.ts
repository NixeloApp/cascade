/**
 * AI Provider Configuration
 *
 * Supports Anthropic Claude and OpenAI GPT with optional custom base URLs
 * for proxy routing (e.g. ccproxy for subscription-based access).
 *
 * Provider is determined by which API key is configured.
 * Models are hardcoded per use case — don't put model names in env vars.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import {
  getAnthropicApiKey,
  getAnthropicBaseUrl,
  getOpenAIApiKey,
  getOpenAIBaseUrl,
  isAnthropicConfigured,
  isOpenAIConfigured,
} from "../lib/env";
import { validation } from "../lib/errors";

export type AIProvider = "anthropic" | "openai";

// Models per use case — hardcoded, not env vars.
const MODELS = {
  anthropic: { primary: "claude-opus-4-5", fast: "claude-haiku-4-5" },
  openai: { primary: "gpt-4o", fast: "gpt-4o-mini" },
} as const;

function getAnthropicProvider() {
  const baseURL = getAnthropicBaseUrl();
  return createAnthropic({
    apiKey: getAnthropicApiKey(),
    ...(baseURL ? { baseURL } : {}),
  });
}

function getOpenAIProvider() {
  const baseURL = getOpenAIBaseUrl();
  return createOpenAI({
    apiKey: getOpenAIApiKey(),
    ...(baseURL ? { baseURL } : {}),
  });
}

/**
 * Get the primary model (chat, summaries, analysis).
 */
export function getModel() {
  if (isAnthropicConfigured()) {
    return getAnthropicProvider()(MODELS.anthropic.primary);
  }
  if (isOpenAIConfigured()) {
    return getOpenAIProvider()(MODELS.openai.primary);
  }
  throw validation(
    "AI_API_KEY",
    "No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in environment variables.",
  );
}

/**
 * Get the fast/cheap model (suggestions, auto-complete).
 */
export function getFastModel() {
  if (isAnthropicConfigured()) {
    return getAnthropicProvider()(MODELS.anthropic.fast);
  }
  if (isOpenAIConfigured()) {
    return getOpenAIProvider()(MODELS.openai.fast);
  }
  throw validation(
    "AI_API_KEY",
    "No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in environment variables.",
  );
}

/**
 * Get the primary model name string (for tracking/logging).
 */
export function getModelId(): string {
  if (isAnthropicConfigured()) return MODELS.anthropic.primary;
  if (isOpenAIConfigured()) return MODELS.openai.primary;
  return "unknown";
}

/**
 * Get the fast model name string (for tracking/logging).
 */
export function getFastModelId(): string {
  if (isAnthropicConfigured()) return MODELS.anthropic.fast;
  if (isOpenAIConfigured()) return MODELS.openai.fast;
  return "unknown";
}

export function isAIConfigured(): boolean {
  return isAnthropicConfigured() || isOpenAIConfigured();
}

export function getActiveProviderName(): string | null {
  if (isAnthropicConfigured()) return "Anthropic Claude";
  if (isOpenAIConfigured()) return "OpenAI GPT";
  return null;
}

export function getActiveProvider(): AIProvider {
  if (isAnthropicConfigured()) return "anthropic";
  if (isOpenAIConfigured()) return "openai";
  throw validation("AI_API_KEY", "No AI provider configured.");
}
