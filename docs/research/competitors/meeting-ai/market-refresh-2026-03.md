# Meeting Intelligence Market Refresh

> **Date:** 2026-03-19
> **Purpose:** Update older meeting-research docs with current market direction, build-vs-buy implications, and reusable open-source options for Nixelo's Read AI style feature work.

---

## Summary

The market has moved beyond "AI meeting notes" as the main wedge.

Current leaders are now converging on four layers:

1. **Meeting capture**
   - Bot joiners, desktop capture, real-time transcription, and broader platform coverage
2. **Cross-meeting memory**
   - Search across meetings, files, email, chat, CRM, and knowledge tools
3. **Agent surfaces**
   - AI chat, MCP access, task-specific agents, and workflow automations
4. **Enterprise controls**
   - Admin governance, workspace management, retention, compliance, and auditability

For Nixelo, this means the current backend foundation is still useful, but the product bar is now higher than "record, transcribe, summarize."

---

## What Changed Since Older Notes

### 1. The category is now memory + agents, not just notes

- **Read AI** is clearly positioned around Search Copilot, agents, workspaces, messaging, email, and direct access to GPT/Claude inside the product.
- **Otter** now positions around AI Chat, flexible capture modes, enterprise controls, and MCP access to meeting knowledge.
- **Fireflies** has expanded into AI Apps, Voice Agents, Live Assist, and a desktop app.
- **tl;dv** is leaning into AI agents, sales coaching, and multi-meeting insights instead of just recordings.

### 2. Capture infrastructure got more serious

- **Recall.ai** is now more than a simple "meeting bot API" story. It also has a Desktop Recording SDK, signed-in bots, Slack Huddles support, and real-time transcription options.
- **Meeting BaaS** looks more credible than older notes suggested, with developer docs, pricing, MCP-related tooling, and licensing / on-prem positioning.

### 3. OSS is strongest in ASR and diarization, not bot joining

- Open-source components are now good enough to help with transcription, diarization, and post-processing.
- The weakest self-built layer remains enterprise-grade meeting capture across Zoom, Teams, Meet, and newer collaboration surfaces.

---

## Commercial Snapshot

### Read AI

**Current read:**
- Moving from meeting notes into broader workplace intelligence
- Search Copilot is central to product identity
- Paid plans bundle access to GPT and Claude inside Read for paid users
- Product navigation now spans meetings, playback, real-time notes, assistants, search, messaging, email, and agents

**Why this matters to Nixelo:**
- Read AI is proving that raw notes are no longer enough
- The differentiator is now "context + retrieval + actionability"

### Otter

**Current read:**
- Stronger than before on meeting archive, AI chat, flexible capture, and enterprise readiness
- MCP access indicates a shift toward "meeting knowledge as infrastructure"

**Why this matters to Nixelo:**
- Cross-meeting retrieval is now table stakes for premium positioning

### Fireflies

**Current read:**
- Has expanded from notetaker into AI Apps, Voice Agents, Live Assist, and desktop capture
- Strong workflow and integration-first story

**Why this matters to Nixelo:**
- Meeting data is increasingly being turned into workflows, not just summaries

### tl;dv

**Current read:**
- Still recorder-first, but now packages AI agents, multi-meeting insights, and sales-facing intelligence more explicitly

**Why this matters to Nixelo:**
- Even simple recorder products are moving upstream into coaching, reporting, and automation

### Recall.ai

**Current read:**
- Most mature build-vs-buy option if Nixelo wants to stop owning meeting joining infrastructure
- Supports broader capture patterns than older docs implied

**Why this matters to Nixelo:**
- Recall is a serious option if reliability across platforms becomes more important than owning the bot implementation

### Meeting BaaS

**Current read:**
- More credible than the older repo notes gave it credit for
- Worth treating as a real lower-cost alternative to Recall

**Why this matters to Nixelo:**
- Could be a cheaper path to multi-platform capture if we do not want to own everything ourselves

---

## Build Vs Buy By Layer

### Layer 1: Meeting capture / bot joining

**Recommendation:** `Buy or stay narrow`

- If Nixelo wants serious Zoom / Teams / Slack / enterprise reliability soon, buying this layer is the pragmatic path.
- If Nixelo stays custom, it should explicitly stay **Google Meet-first** for now and accept the narrower surface.

**Buy candidates:**
- Recall.ai
- Meeting BaaS

**Current Nixelo state:**
- The repo already has a real custom pipeline in [meetingBot.ts](/C:/Users/mikes/Desktop/cascade/convex/meetingBot.ts), [manager.ts](/C:/Users/mikes/Desktop/cascade/bot-service/src/bot/manager.ts), and [google-meet.ts](/C:/Users/mikes/Desktop/cascade/bot-service/src/bot/google-meet.ts)
- Runtime execution is still effectively Google Meet-first

### Layer 2: Transcription

**Recommendation:** `Keep flexible`

- This is one of the strongest layers for OSS and vendor swapping.
- Nixelo already has provider rotation in [transcription.ts](/C:/Users/mikes/Desktop/cascade/bot-service/src/services/transcription.ts)

**Good path:**
- Keep the abstraction
- Test OSS and paid providers against real meeting audio
- Standardize later if quality/cost becomes clear

### Layer 3: Diarization / speaker intelligence

**Recommendation:** `Prototype with OSS`

- OSS here is good enough to evaluate meaningfully
- This is especially useful if Nixelo wants speaker-aware summaries, participant analytics, or conversation dynamics without buying a full intelligence suite

### Layer 4: Summary / extraction / task conversion

**Recommendation:** `Own this layer`

- This is the product logic that matters most for Nixelo
- Meeting-to-issue, meeting-to-doc, blocker extraction, sprint consequence, and project context should remain Nixelo-native

### Layer 5: Cross-meeting memory / agent interface

**Recommendation:** `Build product surface, not just backend`

- This is the biggest current gap relative to the market
- The backend already stores useful meeting artifacts; the app still lacks a first-class recordings / memory / search experience

---

## Open-Source Options Worth Reusing

### Strongest Candidates

#### faster-whisper

- **Repo:** https://github.com/SYSTRAN/faster-whisper
- **Use:** Fast Whisper-style transcription
- **Why it matters:** Strong practical candidate for lower-cost transcription experiments

#### whisper.cpp

- **Repo:** https://github.com/ggml-org/whisper.cpp
- **Use:** Local / CPU-friendly transcription
- **Why it matters:** Useful for cheap local inference, offline tools, or constrained deployments

#### WhisperX

- **Repo:** https://github.com/m-bain/whisperX
- **Use:** Word timestamps and diarization pipeline on top of Whisper-style ASR
- **Why it matters:** Useful if Nixelo wants better transcript alignment and speaker-aware downstream features

#### pyannote.audio

- **Repo:** https://github.com/pyannote/pyannote-audio
- **Use:** Speaker diarization and voice activity analysis
- **Why it matters:** Best OSS building block in this set for speaker intelligence

### Secondary / Experimental

#### MeetingBot

- **Repo:** https://github.com/meetingbot/meetingbot
- **Use:** Open-source meeting-bot API patterns
- **Why it matters:** Good for architecture ideas, but not something to assume is enterprise-ready out of the box

#### joinly

- **Repo:** https://github.com/joinly-ai/joinly
- **Use:** Meeting access for AI agents
- **Why it matters:** More relevant for agent experiments than for a stable production meeting recorder today

#### LiveKit Agents

- **Repo:** https://github.com/livekit/agents
- **Use:** Realtime voice/agent framework
- **Why it matters:** Strong for agent experiences, but does not solve Zoom / Meet / Teams bot joining by itself

### OSS Bottom Line

- **Best OSS fit:** transcription, diarization, speaker-aware post-processing
- **Weakest OSS fit:** enterprise-grade meeting capture / bot reliability across platforms

---

## Nixelo Position Right Now

Nixelo is in a better position than the old docs might suggest:

- There is already a real backend and bot flow
- There is already transcript + summary + participants + issue creation support
- The main missing piece is productization, not raw possibility

Current repo shape:

- **Strong:** scheduling, recording lifecycle, transcript storage, summary storage, participant capture, action-item-to-issue flow
- **Weak:** first-class recordings inbox, cross-meeting memory UX, transcript search product surface, agent layer, broader capture-mode support

The current in-app surface is still mostly [MeetingRecordingSection.tsx](/C:/Users/mikes/Desktop/cascade/src/components/MeetingRecordingSection.tsx) inside [EventDetailsModal.tsx](/C:/Users/mikes/Desktop/cascade/src/components/Calendar/EventDetailsModal.tsx), which is too narrow for where the market is now.

---

## Recommendation

### Short version

- Keep Nixelo-owned workflow intelligence
- Stay flexible on transcription
- Prototype OSS diarization
- Decide explicitly whether meeting capture stays custom or gets bought
- Build the missing first-class product surface

### Pragmatic next decision

Pick one of these paths:

1. **Stay custom, narrow scope**
   - Google Meet-first
   - Improve UI and workflow intelligence first
   - Delay Zoom / Teams / Slack breadth

2. **Buy capture, keep product**
   - Use Recall.ai or Meeting BaaS for capture
   - Keep Nixelo summaries, project context, and action workflows
   - Move faster toward a more complete enterprise surface

3. **Hybrid exploration**
   - Keep current bot for R&D
   - Stand up OSS transcription / diarization experiments
   - Evaluate Recall vs Meeting BaaS in parallel before committing

My current recommendation is **3**, then likely **2** if broader platform reliability becomes a near-term product requirement.

---

## Sources

### Commercial

- Read pricing: https://www.read.ai/plans-pricing
- Read blog on bundled GPT/Claude access: https://www.read.ai/post/read-ai-users-now-have-direct-access-to-openais-chatgpt-and-anthropics-claude--for-free
- Otter homepage: https://otter.ai/
- Fireflies pricing help: https://guide.fireflies.ai/articles/3734844560-learn-about-the-fireflies-pricing-plans
- Fireflies Live Assist / Desktop App launch: https://fireflies.ai/blog/fireflies-launches-live-assist-and-desktop-app
- tl;dv homepage: https://tldv.io/
- Recall pricing: https://www.recall.ai/pricing
- Recall Desktop Recording SDK: https://docs.recall.ai/docs/desktop-sdk
- Recall supported platforms: https://docs.recall.ai/docs/support
- Recall signed-in bots: https://docs.recall.ai/docs/signed-in-bots
- Meeting BaaS homepage: https://www.meetingbaas.com/en
- Meeting BaaS pricing: https://www.meetingbaas.com/en/pricing
- Meeting BaaS docs: https://docs.meetingbaas.com
- Meeting BaaS license / on-prem: https://www.meetingbaas.com/license

### Open Source

- faster-whisper: https://github.com/SYSTRAN/faster-whisper
- whisper.cpp: https://github.com/ggml-org/whisper.cpp
- WhisperX: https://github.com/m-bain/whisperX
- pyannote.audio: https://github.com/pyannote/pyannote-audio
- OpenAI Whisper: https://github.com/openai/whisper
- MeetingBot: https://github.com/meetingbot/meetingbot
- joinly: https://github.com/joinly-ai/joinly
- LiveKit Agents: https://github.com/livekit/agents
