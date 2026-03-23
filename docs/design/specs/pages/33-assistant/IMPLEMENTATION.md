# AI Assistant Page - Implementation

> **Route**: `/:slug/assistant`

---

## Queries

None currently. All displayed data is hardcoded inside the route file.

**Expected future queries:**

| Query | Purpose |
|-------|---------|
| `api.assistant.getConfig` | Fetch system prompt, model, enabled state, help-button flag |
| `api.assistant.getUsageStats` | Fetch spend, questions asked, success rate |
| `api.assistant.getUsageHistory` | Time-series data for the billing tab chart |

---

## Mutations

None currently. Form changes are client-side `useState` only.

**Expected future mutations:**

| Mutation | Purpose |
|----------|---------|
| `api.assistant.updateConfig` | Persist system prompt, model, enabled state, help-button flag |
| `api.assistant.resetConfig` | Restore defaults |

---

## State

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `activeTab` | `"general" \| "billing"` | `"general"` | Controls which tab is shown |
| `enabled` | `boolean` | `true` | Assistant on/off toggle |
| `showHelpButton` | `boolean` | `true` | Help button visibility toggle |
| `model` | `string` | `"gpt-4o"` | Selected AI model |

All state is local `useState` with no persistence.

---

## Component Tree

```text
AssistantPage
├── PageLayout (maxWidth="xl")
│   ├── PageHeader  title="Assistant"
│   ├── AssistantStats
│   │   └── Grid (cols=3)
│   │       ├── Card  "Spend"     $42.50  +12%
│   │       ├── Card  "Questions" 1,240   +5%
│   │       └── Card  "Answered"  1,180   95%
│   └── AssistantConfig
│       └── Tabs
│           ├── TabsTrigger "General"
│           │   ├── Card  StatusCard (IconCircle + Switch)
│           │   └── Card  ConfigCard
│           │       ├── Textarea  (system prompt)
│           │       ├── Grid (cols=2)
│           │       │   ├── Select  (model)
│           │       │   └── Input   (support email)
│           │       └── Switch  (show help button)
│           └── TabsTrigger "Billing"
│               ├── Card  Upgrade banner (brandSolid Button)
│               └── Card  Usage chart placeholder
```

---

## Permissions

- Requires authentication (route is under `_auth` layout).
- Requires organization membership (route is under `_app/$orgSlug` layout).
- No role-based gating currently -- all authenticated org members see the page.
- **Expected**: Only admin/editor roles should be able to modify configuration;
  viewer role should see read-only stats.
