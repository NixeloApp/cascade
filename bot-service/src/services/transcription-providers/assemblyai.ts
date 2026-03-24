/**
 * AssemblyAI Transcription Provider
 *
 * Cost: ~$0.21/hour (Universal-3 Pro pre-recorded)
 * Free tier: 185 hours one-time credit (pre-recorded)
 * Docs: https://www.assemblyai.com/docs
 */

import * as fs from "node:fs";
import { retryApi } from "../../utils/retry.js";
import type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";

interface AssemblyAIUtterance {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: string;
  words: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker: string;
  }>;
}

interface AssemblyAITranscript {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string | null;
  utterances: AssemblyAIUtterance[] | null;
  audio_duration: number | null;
  language_code: string | null;
  error: string | null;
}

export class AssemblyAIProvider implements TranscriptionProvider {
  readonly name = "assemblyai";
  private apiKey: string | null = null;
  private baseUrl = "https://api.assemblyai.com/v2";

  constructor() {
    this.apiKey = process.env.ASSEMBLYAI_API_KEY || null;
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error("AssemblyAI provider not configured. Set ASSEMBLYAI_API_KEY.");
    }

    const startTime = Date.now();

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Step 1: Upload audio file
    const audioBuffer = fs.readFileSync(audioFilePath);

    const uploadResponse = await retryApi(async () => {
      const res = await fetch(`${this.baseUrl}/upload`, {
        method: "POST",
        headers: {
          authorization: this.apiKey!,
          "Content-Type": "application/octet-stream",
        },
        body: audioBuffer,
      });

      if (!res.ok) {
        throw new Error(`AssemblyAI upload failed: ${res.status} ${await res.text()}`);
      }

      return res.json() as Promise<{ upload_url: string }>;
    });

    // Step 2: Start transcription with speaker diarization
    const transcriptResponse = await retryApi(async () => {
      const res = await fetch(`${this.baseUrl}/transcript`, {
        method: "POST",
        headers: {
          authorization: this.apiKey!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: uploadResponse.upload_url,
          speaker_labels: true,
          language_detection: true,
        }),
      });

      if (!res.ok) {
        throw new Error(
          `AssemblyAI transcription request failed: ${res.status} ${await res.text()}`,
        );
      }

      return res.json() as Promise<AssemblyAITranscript>;
    });

    // Step 3: Poll for completion
    let result: AssemblyAITranscript | null = null;
    const maxWaitMs = 600000; // 10 minutes
    const pollIntervalMs = 2000;
    const startPoll = Date.now();

    while (Date.now() - startPoll < maxWaitMs) {
      const statusResponse = await fetch(`${this.baseUrl}/transcript/${transcriptResponse.id}`, {
        headers: {
          authorization: this.apiKey!,
        },
      });

      const status = (await statusResponse.json()) as AssemblyAITranscript;

      if (status.status === "completed") {
        result = status;
        break;
      } else if (status.status === "error") {
        throw new Error(`AssemblyAI transcription failed: ${status.error}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    if (!result) {
      throw new Error("AssemblyAI transcription timed out");
    }

    const processingTime = Date.now() - startTime;

    const fullText = result.text || "";

    // Map utterances to segments with speaker labels
    const segments: TranscriptSegment[] = (result.utterances || []).map((u) => ({
      startTime: u.start / 1000, // AssemblyAI uses milliseconds
      endTime: u.end / 1000,
      text: u.text,
      confidence: u.confidence,
      speaker: u.speaker ? `Speaker ${u.speaker}` : undefined,
    }));

    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;
    const durationMinutes = (result.audio_duration || 0) / 60;

    // Count unique speakers
    const speakers = new Set(
      (result.utterances || []).map((u) => u.speaker).filter((s) => s !== undefined),
    );
    const speakerCount = speakers.size > 0 ? speakers.size : undefined;

    return {
      fullText,
      segments,
      language: result.language_code || "en",
      modelUsed: "assemblyai-universal",
      processingTime,
      wordCount,
      durationMinutes,
      speakerCount,
    };
  }
}
