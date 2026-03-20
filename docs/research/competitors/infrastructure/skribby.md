# Skribby - Infrastructure Analysis

> **Last Updated:** 2026-01-28
> **Category:** Meeting Bot API
> **Type:** Paid API (Developer Focused)
> **Website:** https://skribby.io

> **Refresh Note (2026-03-19):** This doc predates the March 2026 market refresh. Use
> [market-refresh-2026-03.md](../meeting-ai/market-refresh-2026-03.md)
> for the current market read. If this doc conflicts with the current repo implementation,
> the repo and refresh doc win.

---

## Overview

**Skribby** is a developer-first meeting bot API targeting indie hackers, early-stage startups, and cost-conscious teams building meeting intelligence features. The platform competes directly with Recall.ai but differentiates on simplicity, transparent pricing, and transcription provider flexibility. At $0.35/hour with no contracts, platform fees, or minimums, Skribby is the most affordable proprietary meeting bot API in the market.

Skribby supports Zoom, Microsoft Teams, and Google Meet through a single REST API, with bots deployable in as little as 5 minutes. A key differentiator is the support for 10+ transcription providers (including Whisper, Deepgram, and AssemblyAI), allowing developers to optimize for accuracy, cost, or language support based on their specific use case. In independent side-by-side tests, Skribby delivered transcripts 6x faster and cost 31% less than Meeting BaaS for equivalent usage patterns.

---

## Pricing

| Component | Cost | Details |
|-----------|------|---------|
| **Recording + Transcription** | $0.35/hour | All-inclusive, per-minute billing |
| **Free Trial** | 5 hours | No credit card required |
| **Contracts** | None | Pay-as-you-go only |
| **Minimums** | None | No monthly minimum spend |
| **Platform Fees** | None | No additional base fees |
| **Volume Discounts** | Available | Contact for high-volume pricing |

### Pricing Analysis

Skribby is the most affordable proprietary option in the meeting bot API space. At $0.35/hour all-in, it is approximately 46% cheaper than Recall.ai (~$0.65/hour with transcription) and 49% cheaper than Meeting BaaS's hosted option ($0.69/hour). The pricing includes bot deployment, raw audio recording, and live webhook notifications, all billed per active minute. For a startup processing 500 hours of meetings per month, Skribby would cost approximately $175/month compared to $325 with Recall.ai or $345 with Meeting BaaS hosted. The 5-hour free trial with no credit card requirement lowers the barrier to evaluation. Volume discounts are available for high-volume customers but require direct contact.

---

## Core Features

### Bot Management (★★★★☆)
- Create bots via `POST /bot` endpoint with custom configuration
- Custom bot names and meeting join behavior
- Scheduling and stop conditions (time limits up to 4 hours, silence detection)
- Bot lifecycle management (create, monitor, stop, remove)
- Bearer token authentication for all API requests

### Recording (★★★★☆)
- Audio recording across Zoom, Microsoft Teams, and Google Meet
- Optional video recording capability
- Secure storage with flexible retention options
- Easy retrieval via dedicated API endpoints
- Per-minute billing prevents overpaying for short meetings

### Transcription (★★★★★)
- **10+ transcription model options** including:
  - Whisper (OpenAI)
  - Deepgram (standard and real-time)
  - AssemblyAI
  - Additional providers for specialized use cases
- Real-time transcription via `deepgram-realtime` model selection
- Profanity filter support for content moderation
- Bring-your-own-credentials for transcription providers
- Optimize for accuracy, cost, or language per use case

### Webhooks & Real-time (★★★★☆)
- WebSocket URLs for live transcription streaming
- Webhook notifications for bot status updates
- Instant notifications for transcripts, recordings, and bot events
- Optional `webhook_url` parameter on bot creation
- Event-driven architecture reduces polling overhead

### Developer Experience (★★★★☆)
- Simple REST API with minimal boilerplate
- Bearer auth reduces integration complexity
- Dashboard for API key generation (GitHub/Google login)
- 5-minute deployment claim for first bot
- OpenAPI specification available for client generation

---

## Strengths

1. **Most Affordable:** At $0.35/hour all-in with no platform fees, contracts, or minimums, Skribby is the cheapest proprietary meeting bot API available.
2. **Transcription Flexibility:** 10+ transcription model options (Whisper, Deepgram, AssemblyAI) with bring-your-own-credentials; no other provider offers this breadth.
3. **Simplicity:** Less "enterprise bloat" than larger providers; minimal API surface area means faster integration and fewer abstractions to learn.
4. **Fast Transcript Delivery:** 6x faster transcript delivery than Meeting BaaS in independent side-by-side testing.
5. **Low Barrier to Entry:** 5-hour free trial with no credit card, GitHub/Google login, and API key generation in minutes.
6. **Active Community:** Fast support response times and active Discord community for developer assistance.

---

## Weaknesses

1. **Limited Platform Coverage:** Only supports Zoom, Teams, and Google Meet; missing Webex, Slack Huddles, and GoTo Meeting that Recall.ai covers.
2. **No SDK:** No official SDK currently available; developers must use REST API directly (though OpenAPI spec allows client generation).
3. **Startup Risk:** Smaller company with less funding and fewer enterprise customers than Recall.ai ($51M funded, 300+ clients).
4. **No Compliance Certifications:** Lacks SOC2, HIPAA, and ISO 27001 certifications required by enterprise and healthcare customers.
5. **Feature Depth:** Fewer advanced features compared to enterprise platforms; no speaking bot, output media, or desktop recording SDK.
6. **Documentation Maturity:** Less comprehensive documentation and fewer integration guides compared to Recall.ai.

---

## Compliance & Security

| Certification | Status |
|---------------|--------|
| SOC2 Type II | Not certified |
| ISO 27001 | Not certified |
| GDPR | Not formally certified |
| CCPA | Not formally certified |
| HIPAA | Not certified |

### Data Handling
- **Authentication:** Bearer token via API key + OAuth for auth accounts
- **OAuth Integration:** OAuth-based auth accounts for joining private meetings in regulated fields
- **Storage:** Secure meeting recording storage with flexible retention and easy retrieval
- **API Keys:** Generated via Dashboard with GitHub or Google login
- **Encryption:** Standard HTTPS for API communication
- **Private Meetings:** OAuth auth accounts enable compliance in regulated environments (e.g., healthcare access, though not HIPAA certified)

---

## Integration Strategy

### API Design
- RESTful API with straightforward endpoint structure
- Core endpoint: `POST /bot` for bot creation with configuration options
- JSON request/response payloads
- Bearer token authentication on all requests
- Optional webhook URL parameter per bot
- OpenAPI specification for documentation and client generation

### Key Configuration Options
- `transcription_model`: Select from 10+ providers (whisper, deepgram, assembly-ai, deepgram-realtime)
- `video_recording`: Enable/disable video capture
- `profanity_filter`: Content moderation toggle
- `webhook_url`: Per-bot webhook destination
- `max_duration`: Time limits up to 4 hours
- `silence_detection`: Auto-stop on meeting silence

### Real-time Integration
- WebSocket URLs returned for live transcription streaming
- Webhook POST events for bot lifecycle and completion
- No polling required; fully event-driven architecture

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| API Style | RESTful with JSON |
| API Docs | OpenAPI specification |
| Auth | Bearer token (API key) + OAuth (auth accounts) |
| Real-time | WebSocket (transcription), webhooks (events) |
| Transcription | 10+ providers (Whisper, Deepgram, AssemblyAI, etc.) |
| Billing | Stripe integration, per-minute tracking |
| Platforms | Zoom, Microsoft Teams, Google Meet |
| Developer Login | GitHub, Google OAuth |

---

## Alternatives

| Provider | Price/hr | Platforms | Transcription | Self-Host | Compliance |
|----------|---------|-----------|---------------|-----------|------------|
| **Skribby** | $0.35 | 3 | 10+ providers (BYO creds) | No | None |
| **Recall.ai** | ~$0.65 | 6 | Built-in + 2 providers | No | SOC2, HIPAA, ISO |
| **Meeting BaaS** | $0.69 (hosted) | 3 | Gladia | Yes ($0.066/hr) | None |
| **Nylas Notetaker** | $0.70 | 3 | Built-in | No | SOC2, HIPAA, ISO |

---

## Nixelo vs Skribby

| Dimension | Nixelo | Skribby |
|-----------|--------|---------|
| **Primary Function** | Project management + Voice AI | Meeting bot API |
| **Relationship** | Potential customer | Infrastructure provider |
| **Meeting Platforms** | Custom Google Meet-first bot today | Zoom, Teams, Meet (3 platforms) |
| **AI Processing** | Text AI, Voice AI, action items | Raw recording + transcription |
| **Transcription** | Custom summary stack + provider flexibility in repo | 10+ model options with BYO creds |
| **Calendar** | Google Calendar sync | No calendar features |
| **Target User** | End-user teams | Developer teams / startups |
| **Compliance** | Depends on chosen capture provider | No formal certifications |
| **Pricing** | Platform subscription | $0.35/hour usage-based |

---

## Key Takeaways

### What to Learn
- **Transcription provider flexibility:** Offering 10+ transcription models with bring-your-own-credentials is a powerful developer feature; Nixelo could expose similar flexibility to let users choose accuracy vs. cost tradeoffs.
- **Transparent pricing:** No hidden fees, no contracts, no minimums builds trust with developer audiences; apply similar transparency to Nixelo's Voice AI pricing tier.
- **Fast time-to-value:** 5-minute deployment with free trial and no credit card is a benchmark for developer onboarding; Nixelo should aim for equally frictionless bot-service setup.
- **Silence detection and auto-stop:** Smart stop conditions prevent billing for idle meetings; implement similar controls in Nixelo's Voice AI to optimize costs.

### What to Avoid
- **Lack of compliance certifications:** Enterprise and healthcare customers cannot evaluate Skribby without SOC2/HIPAA; this limits its addressable market severely.
- **No SDK strategy:** Relying solely on REST API without an SDK increases integration friction; provide both.
- **Narrow platform coverage:** Supporting only 3 platforms misses enterprise use cases (Webex, Slack Huddles) that Recall.ai handles.
- **Startup dependency risk:** Building critical infrastructure on a small, unfunded startup carries significant platform risk.

---

## Nixelo Integration Strategy

Skribby is still a plausible lower-cost provider to keep on the board, though Meeting BaaS
has a stronger self-hosting story:

1. **Current Position:** Skribby is not integrated with Nixelo, and the repo does not show a finalized provider strategy yet.
2. **Cost Savings Scenario:** If Nixelo wants a cheaper hosted option than Recall without going fully self-hosted, Skribby could be worth a targeted evaluation.
3. **Transcription Flexibility:** Skribby's 10+ transcription model options could benefit Nixelo users who need specialized language support or want to bring their own transcription credentials for cost control.
4. **Evaluation Criteria:** Before adopting Skribby, Nixelo should evaluate: (a) company stability and funding status, (b) SOC2 certification timeline, (c) SDK availability, and (d) platform coverage expansion plans.
5. **Architecture Consideration:** Nixelo's bot-service abstraction layer should support multiple providers; Skribby's REST API simplicity would make it the easiest secondary provider to integrate after Meeting BaaS.

---

## Verdict

Skribby still fills a useful niche as a low-cost, developer-friendly bot API with unusually flexible transcription options. However, the compliance gap, narrower platform coverage, and startup risk keep it from being the default recommendation for Nixelo. **Recommendation:** Keep it as a monitored option for cost-sensitive hosted capture, but prioritize the idea of transcription flexibility over the assumption that Skribby itself should become the main provider.
