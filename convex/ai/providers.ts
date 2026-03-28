/**
 * AI Provider Abstraction Layer
 *
 * Thin wrapper over Vercel AI SDK's generateText.
 * Uses the shared getModel() from config.ts which handles
 * provider selection and custom base URLs.
 */

import { generateText } from "ai";
import { getModel } from "./config";

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
 * Call the configured AI provider.
 */
export async function callAI(messages: AIMessage[]): Promise<AIResponse> {
  const model = getModel();

  const result = await generateText({
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  return {
    content: result.text,
    provider: model.provider,
    usage: result.usage
      ? {
          promptTokens: result.usage.inputTokens ?? 0,
          completionTokens: result.usage.outputTokens ?? 0,
          totalTokens:
            result.usage.totalTokens ??
            (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0),
        }
      : undefined,
  };
}
