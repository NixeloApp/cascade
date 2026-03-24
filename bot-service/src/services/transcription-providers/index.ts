/**
 * Transcription Provider Registry
 *
 * 3-tier fallback system:
 *
 * TIER 1 — Recurring monthly free tiers (burned first, reset every month):
 * - Speechmatics: 8 hrs/month
 * - Gladia: 10 hrs/month
 * - Azure: 5 hrs/month
 * - Google Cloud STT: 1 hr/month
 * Total: ~24 hours/month recurring
 *
 * TIER 2 — One-time credits (burned after recurring exhausted):
 * - Deepgram: $200 credit (~700 hrs)
 * - AssemblyAI: 185 hrs
 * Total: ~885 hours one-time
 *
 * TIER 3 — Paid fallback (when all free/credits exhausted):
 * - Deepgram Nova-3: $0.0077/min (cheapest paid option)
 *
 * Provider selection is handled by Convex serviceRotation.ts which
 * picks the best provider based on remaining capacity. The priority
 * numbers encode the tier ordering: 1-4 = recurring, 5-6 = one-time,
 * 7+ = paid fallback.
 *
 * See docs/ai/voice/ARCHITECTURE.md for full analysis.
 */

export { AssemblyAIProvider } from "./assemblyai.js";
export { AzureProvider } from "./azure.js";
export { DeepgramProvider } from "./deepgram.js";
export { GladiaProvider } from "./gladia.js";
export { GoogleCloudSTTProvider } from "./google.js";
export type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";
export { SpeechmaticsProvider } from "./speechmatics.js";

import { AssemblyAIProvider } from "./assemblyai.js";
import { AzureProvider } from "./azure.js";
import { DeepgramProvider } from "./deepgram.js";
import { GladiaProvider } from "./gladia.js";
import { GoogleCloudSTTProvider } from "./google.js";
import type { TranscriptionProvider } from "./provider.js";
import { SpeechmaticsProvider } from "./speechmatics.js";

/**
 * Get a provider instance by name
 */
export function getProvider(name: string): TranscriptionProvider | null {
  const providers: Record<string, () => TranscriptionProvider> = {
    speechmatics: () => new SpeechmaticsProvider(),
    gladia: () => new GladiaProvider(),
    azure: () => new AzureProvider(),
    google: () => new GoogleCloudSTTProvider(),
    deepgram: () => new DeepgramProvider(),
    assemblyai: () => new AssemblyAIProvider(),
  };

  const factory = providers[name.toLowerCase()];
  return factory ? factory() : null;
}

/**
 * Get all configured providers across all tiers
 */
export function getConfiguredProviders(): TranscriptionProvider[] {
  const allProviders = [
    // Tier 1: Recurring monthly free tiers
    new SpeechmaticsProvider(), // 8 hrs/month
    new GladiaProvider(), // 10 hrs/month
    new AzureProvider(), // 5 hrs/month
    new GoogleCloudSTTProvider(), // 1 hr/month
    // Tier 2: One-time credits
    new DeepgramProvider(), // ~700 hrs one-time
    new AssemblyAIProvider(), // 185 hrs one-time
  ];

  return allProviders.filter((p) => p.isConfigured());
}

/**
 * Provider names in priority order (tier 1 → tier 2 → tier 3)
 *
 * Tier 1: Recurring monthly free tiers (~24 hrs/month)
 * Tier 2: One-time credits (~885 hrs total)
 * Tier 3: Paid fallback (Deepgram is cheapest at $0.0077/min)
 */
export const PROVIDER_PRIORITY = [
  // Tier 1: Recurring monthly
  "speechmatics", // 8 hrs/month
  "gladia", // 10 hrs/month
  "azure", // 5 hrs/month
  "google", // 1 hr/month
  // Tier 2: One-time credits
  "deepgram", // ~700 hrs ($200 credit)
  "assemblyai", // 185 hrs
] as const;

export type ProviderName = (typeof PROVIDER_PRIORITY)[number];
