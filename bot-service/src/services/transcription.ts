/**
 * Transcription Service with Provider Rotation
 *
 * Automatically selects the best available provider based on free tier usage.
 * Integrates with Convex to track usage across providers.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex-api.js";
import {
  getProvider,
  PROVIDER_PRIORITY,
  type TranscriptionResult,
} from "./transcription-providers/index.js";

export type { TranscriptionResult, TranscriptSegment } from "./transcription-providers/index.js";

interface ProviderSelection {
  provider: string;
  displayName: string;
  freeUnitsRemaining: number;
  isUsingFreeTier: boolean;
  costPerUnit: number;
  unitType: string;
}

export class TranscriptionService {
  private convex: ConvexHttpClient;
  private apiKey: string;

  constructor() {
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      throw new Error("CONVEX_URL environment variable not set");
    }
    this.apiKey = process.env.BOT_SERVICE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("BOT_SERVICE_API_KEY not set - usage tracking will be disabled");
    }
    this.convex = new ConvexHttpClient(convexUrl);
  }

  /**
   * Get the best available provider from Convex
   */
  private async selectProvider(): Promise<ProviderSelection | null> {
    try {
      const selected = await this.convex.query(api.serviceRotation.selectProvider, {
        serviceType: "transcription",
        apiKey: this.apiKey,
      });
      return selected;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Record usage to Convex after transcription
   */
  private async recordUsage(provider: string, minutesUsed: number): Promise<void> {
    if (!this.apiKey) {
      console.warn("Skipping usage recording: BOT_SERVICE_API_KEY is not configured");
      return;
    }

    try {
      await this.convex.mutation(api.serviceRotation.recordUsage, {
        apiKey: this.apiKey,
        serviceType: "transcription",
        provider,
        unitsUsed: Math.ceil(minutesUsed), // Round up to nearest minute
      });
    } catch (_error) {
      // Don't throw - usage tracking shouldn't block transcription
      console.error("Failed to record transcription usage:", _error);
    }
  }

  /**
   * Get a fallback provider (first configured one)
   */
  private getFallbackProvider(): string | null {
    for (const name of PROVIDER_PRIORITY) {
      const provider = getProvider(name);
      if (provider?.isConfigured()) {
        return name;
      }
    }
    return null;
  }

  /**
   * Transcribe audio file using the best available provider
   */
  async transcribe(audioFilePath: string): Promise<TranscriptionResult & { provider: string }> {
    // Try to get best provider from Convex
    let providerName: string;
    const selection = await this.selectProvider();

    if (selection) {
      providerName = selection.provider;
    } else {
      // Fallback to first configured provider
      const fallback = this.getFallbackProvider();
      if (!fallback) {
        throw new Error("No transcription providers configured");
      }
      providerName = fallback;
    }

    const provider = getProvider(providerName);
    if (!provider?.isConfigured()) {
      throw new Error(`Provider ${providerName} is not configured`);
    }

    // Transcribe
    const startTime = Date.now();
    const result = await provider.transcribe(audioFilePath);
    const _elapsedMs = Date.now() - startTime;

    // Record usage
    await this.recordUsage(providerName, result.durationMinutes);

    return {
      ...result,
      provider: providerName,
    };
  }

  /**
   * Transcribe with a specific provider (for testing or manual override)
   */
  async transcribeWithProvider(
    audioFilePath: string,
    providerName: string,
  ): Promise<TranscriptionResult & { provider: string }> {
    const provider = getProvider(providerName);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    if (!provider.isConfigured()) {
      throw new Error(`Provider ${providerName} is not configured`);
    }

    const result = await provider.transcribe(audioFilePath);

    // Record usage
    await this.recordUsage(providerName, result.durationMinutes);

    return {
      ...result,
      provider: providerName,
    };
  }

  /**
   * Get usage summary for all transcription providers
   */
  async getUsageSummary() {
    try {
      return await this.convex.query(api.serviceRotation.getUsageSummary, {
        serviceType: "transcription",
        apiKey: this.apiKey,
      });
    } catch (_error) {
      return null;
    }
  }

  /**
   * For testing without actual audio file
   */
  async transcribeFromText(text: string): Promise<TranscriptionResult & { provider: string }> {
    const words = text.split(/\s+/);
    const wordsPerSecond = 2.5;

    const segments = [];
    let currentStart = 0;

    for (let i = 0; i < words.length; i += 30) {
      const segmentWords = words.slice(i, i + 30);
      const duration = segmentWords.length / wordsPerSecond;

      segments.push({
        startTime: currentStart,
        endTime: currentStart + duration,
        text: segmentWords.join(" "),
      });

      currentStart += duration;
    }

    const durationMinutes = currentStart / 60;

    return {
      fullText: text,
      segments,
      language: "en",
      modelUsed: "mock",
      processingTime: 0,
      wordCount: words.length,
      durationMinutes,
      provider: "mock",
    };
  }
}
