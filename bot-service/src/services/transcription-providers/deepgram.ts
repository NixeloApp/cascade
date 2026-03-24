/**
 * Deepgram Transcription Provider
 *
 * Cost: ~$0.0077/minute (Nova-3)
 * Free tier: $200 one-time credit (~700 hours)
 * Docs: https://developers.deepgram.com/docs/pre-recorded-audio
 */

import * as fs from "node:fs";
import { retryApi } from "../../utils/retry.js";
import type { TranscriptionProvider, TranscriptionResult, TranscriptSegment } from "./provider.js";
import { getAudioContentType } from "./provider.js";

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
}

interface DeepgramResponse {
  metadata: {
    duration: number;
    models: string[];
  };
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: DeepgramWord[];
      }>;
    }>;
  };
}

export class DeepgramProvider implements TranscriptionProvider {
  readonly name = "deepgram";
  private apiKey: string | null = null;
  private baseUrl = "https://api.deepgram.com/v1";

  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY || null;
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error("Deepgram provider not configured. Set DEEPGRAM_API_KEY.");
    }

    const startTime = Date.now();

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    const audioBuffer = fs.readFileSync(audioFilePath);
    const contentType = getAudioContentType(audioFilePath);

    // Transcribe with diarization, smart formatting, and punctuation
    const params = new URLSearchParams({
      model: "nova-3",
      smart_format: "true",
      diarize: "true",
      punctuate: "true",
      utterances: "true",
    });

    const response = await retryApi(async () => {
      const res = await fetch(`${this.baseUrl}/listen?${params}`, {
        method: "POST",
        headers: {
          Authorization: `Token ${this.apiKey}`,
          "Content-Type": contentType,
        },
        body: audioBuffer,
      });

      if (!res.ok) {
        throw new Error(`Deepgram transcription failed: ${res.status} ${await res.text()}`);
      }

      return res.json() as Promise<DeepgramResponse>;
    });

    const processingTime = Date.now() - startTime;

    const channel = response.results.channels[0];
    const alternative = channel?.alternatives[0];

    if (!alternative) {
      throw new Error("Deepgram returned no transcription results");
    }

    const fullText = alternative.transcript;

    // Group words into segments by speaker changes (or ~30 second chunks)
    const segments: TranscriptSegment[] = [];
    let currentSegment: { words: DeepgramWord[]; speaker?: number } = { words: [] };

    for (const word of alternative.words) {
      const speakerChanged =
        currentSegment.speaker !== undefined && word.speaker !== currentSegment.speaker;
      const segmentTooLong =
        currentSegment.words.length > 0 && word.start - currentSegment.words[0].start > 30;

      if ((speakerChanged || segmentTooLong) && currentSegment.words.length > 0) {
        segments.push(this.buildSegment(currentSegment.words, currentSegment.speaker));
        currentSegment = { words: [], speaker: word.speaker };
      }

      if (currentSegment.words.length === 0) {
        currentSegment.speaker = word.speaker;
      }

      currentSegment.words.push(word);
    }

    // Push final segment
    if (currentSegment.words.length > 0) {
      segments.push(this.buildSegment(currentSegment.words, currentSegment.speaker));
    }

    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;
    const durationMinutes = response.metadata.duration / 60;

    // Count unique speakers
    const speakers = new Set(
      alternative.words.map((w) => w.speaker).filter((s) => s !== undefined),
    );
    const speakerCount = speakers.size > 0 ? speakers.size : undefined;

    return {
      fullText,
      segments,
      language: "en",
      modelUsed: "deepgram-nova-3",
      processingTime,
      wordCount,
      durationMinutes,
      speakerCount,
    };
  }

  private buildSegment(words: DeepgramWord[], speaker?: number): TranscriptSegment {
    const text = words.map((w) => w.word).join(" ");
    const avgConfidence = words.reduce((sum, w) => sum + w.confidence, 0) / words.length;

    return {
      startTime: words[0].start,
      endTime: words[words.length - 1].end,
      text,
      confidence: avgConfidence,
      speaker: speaker !== undefined ? `Speaker ${speaker}` : undefined,
    };
  }
}
