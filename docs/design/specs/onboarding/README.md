# Onboarding Flow Specs

This directory contains design specifications for the onboarding experience.

## Overview

Nixelo has a two-track onboarding flow based on user role:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           Role Selection                                    │
│                                                                             │
│                     "How will you use Nixelo?"                             │
│                                                                             │
│            ┌─────────────────┐    ┌─────────────────┐                       │
│            │   Team Lead     │    │  Team Member    │                       │
│            │                 │    │                 │                       │
│            │ Create projects │    │  Join & work    │                       │
│            └────────┬────────┘    └────────┬────────┘                       │
│                     │                      │                                │
│                     ▼                      ▼                                │
│            ┌─────────────────┐    ┌─────────────────┐                       │
│            │ Lead Onboarding │    │Member Onboarding│                       │
│            │                 │    │                 │                       │
│            │ 1. Features     │    │ 1. Create Org   │                       │
│            │ 2. Create Org   │    │ 2. Features     │                       │
│            │ 3. Sample/Blank │    │ 3. Dashboard    │                       │
│            │ 4. Dashboard    │    │                 │                       │
│            └─────────────────┘    └─────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

| Component | Purpose | File |
|-----------|---------|------|
| RoleSelector | Choose lead vs member | `RoleSelector.tsx` |
| LeadOnboarding | Full lead flow (features → org → project) | `LeadOnboarding.tsx` |
| MemberOnboarding | Simplified member flow (org → features) | `MemberOnboarding.tsx` |
| FeatureHighlights | Showcase key features | `FeatureHighlights.tsx` |
| InvitedWelcome | For users arriving via invite | `InvitedWelcome.tsx` |
| WelcomeTour | Interactive product tour | `WelcomeTour.tsx` |
| ProjectWizard | Create first project wizard | `ProjectWizard.tsx` |
| SampleProjectModal | Create sample project | `SampleProjectModal.tsx` |
| Checklist | Onboarding progress checklist | `Checklist.tsx` |

## Status

| Step | Component | Status |
|------|-----------|--------|
| Role Selection | `RoleSelector.tsx` | 🟢 GOOD |
| Lead: Features | `LeadOnboarding.tsx` | 🟢 GOOD |
| Lead: Create Org | `LeadOnboarding.tsx` | 🟢 GOOD |
| Lead: Project Choice | `LeadOnboarding.tsx` | 🟢 GOOD |
| Member: Create Org | `MemberOnboarding.tsx` | 🟢 GOOD |
| Member: Features | `MemberOnboarding.tsx` | 🟢 GOOD |
| Welcome Tour | `WelcomeTour.tsx` | 🟡 REVIEW |
| Checklist | `Checklist.tsx` | 🟡 REVIEW |

## Design Principles

1. **Progressive disclosure** - Show only what's needed at each step
2. **Escape hatches** - Always allow skipping/going back
3. **Role-appropriate** - Different paths for leads vs members
4. **Sample data option** - Let users explore with pre-filled content
5. **Mintlify-inspired** - Clean, minimal, confident styling
