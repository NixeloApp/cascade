# AI Recording: Transcription Upgrade Plan

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-23
> **Context:** See `docs/ai/voice/ARCHITECTURE.md` for full build-vs-buy research

## What's Done

- [x] 3-tier provider system built and integrated
- [x] Deepgram provider (`deepgram.ts`) — $200 one-time credit (~700 hrs), speaker ID, Nova-3 model
- [x] AssemblyAI provider (`assemblyai.ts`) — 185 hrs one-time credit, speaker ID, language detection
- [x] Provider registry updated with 6 providers in 3 tiers
- [x] Convex seed data updated (Gladia corrected to 10hrs/month, Deepgram + AssemblyAI added)
- [x] Docs updated (ARCHITECTURE.md, SETUP.md, meeting-intelligence.md)

## Current Capacity

**Tier 1 — Recurring monthly:** ~24 hrs/month
| Provider | Free | Speaker ID |
|----------|------|------------|
| Speechmatics | 8 hrs/month | No (not enabled) |
| Gladia | 10 hrs/month | Yes |
| Azure | 5 hrs/month | No |
| Google Cloud STT | 1 hr/month | Yes (2 speakers) |

**Tier 2 — One-time credits:** ~885 hrs total
| Provider | Credit | Speaker ID |
|----------|--------|------------|
| Deepgram | ~700 hrs ($200) | Yes |
| AssemblyAI | 185 hrs | Yes |

**Tier 3 — Paid fallback:** Deepgram at $0.0077/min after credits run out

**At 50 hrs/month, the one-time credits alone last ~17 months before touching paid tier.**

## What's Left

### Human tasks (you)
- [ ] Sign up for Deepgram, get API key, add `DEEPGRAM_API_KEY` to bot-service `.env`
- [ ] Sign up for AssemblyAI, get API key, add `ASSEMBLYAI_API_KEY` to bot-service `.env`
- [ ] Run Convex seed to register new providers: `npx convex run serviceRotation:seedProviders`
- [ ] Test: record a short meeting, verify Deepgram/AssemblyAI transcription works

### Code tasks (remaining)
- [ ] Enable Speechmatics speaker ID in existing code (it supports it, not turned on)
- [ ] Update transcript UI to show speaker labels
- [ ] Update Claude summary prompt to use speaker names for action item attribution

## Future: Self-Host WhisperX (when volume justifies ~$200/mo)

Only relevant at 170+ hrs/month. See `docs/ai/voice/ARCHITECTURE.md` for full specs.

- Hetzner GEX44: RTX 4000 SFF Ada (20 GB VRAM), EUR 184/mo
- WhisperX: transcription + speaker ID + word timestamps, all in one
- ~3-6 min processing per hour of audio
- WebM/Opus from our bot works directly (no conversion)

## Future: Multi-Platform (Vexa/Attendee)

Swap our Playwright bot for Vexa (Apache-2.0) to get Zoom + Teams. Separate effort.

## Future: Buy Premium (Recall.ai)

Only if enterprise customers demand SOC-2/HIPAA or niche platforms.
