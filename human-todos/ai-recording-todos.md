# AI Recording: Transcription Upgrade Plan

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-27
> **Context:** See `docs/ai/voice/ARCHITECTURE.md` for full build-vs-buy research

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

## Next: Audio + Video Storage

Current bot captures audio only to /tmp — never persisted, no video. Competitors keep both.

### Storage recommendation: Cloudflare R2
- $0.015/GB/mo, no egress fees (playback is free)
- 100 meetings at 720p video = ~$1.50/mo
- If we get Hetzner box later, 1.9 TB included storage can take over

### Tasks
- [ ] Set up Cloudflare R2 bucket
- [ ] Upload audio to R2 after transcription, store URL in `meetingRecordings.recordingUrl`
- [ ] Delete temp files after successful upload
- [ ] Add audio playback to meeting recording UI
- [ ] Video capture — requires adopting Vexa/Attendee (our Playwright bot can't do video well)
- [ ] Video playback UI once capture exists

## Next: Multi-Platform + Video (Vexa/Attendee)

Vexa/Attendee solve two problems at once:
1. Multi-platform (Zoom + Teams, not just Google Meet)
2. Video capture (our Playwright bot only does audio)

- Vexa: Apache-2.0, ~1,800 stars, built-in transcription, MCP server, video capture
- Attendee: Open source, ~522 stars, 3,766 commits, more battle-tested, video capture
- Both self-hostable — runs under the hood, users see same UI

### Tasks
- [ ] Pilot Vexa locally — join a test meeting, verify audio + video capture
- [ ] If Vexa works → replace our Playwright bot, get Zoom/Teams/video for free
- [ ] If too rough → try Attendee as fallback
- [ ] Wire captured video to R2 storage
- [ ] Update meeting UI with video player

## Future: Self-Host WhisperX (when volume justifies ~$200/mo)

Only relevant at 170+ hrs/month. See `docs/ai/voice/ARCHITECTURE.md` for full specs.

- Hetzner GEX44: RTX 4000 SFF Ada (20 GB VRAM), EUR 184/mo
- WhisperX: transcription + speaker ID + word timestamps, all in one
- ~3-6 min processing per hour of audio
- WebM/Opus from our bot works directly (no conversion)

## Future: Buy Premium (Recall.ai)

Only if enterprise customers demand SOC-2/HIPAA or niche platforms.
