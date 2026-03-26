# Screenshot And E2E Explainer

This doc explains the screenshot CI job, why it is slow, why it is sharded, and what the `PlateEditor` E2E hooks are doing.

## What This CI Job Actually Is

The `Screenshots` workflow is not the normal product E2E suite.

It is a visual review pipeline that:

1. Builds the app once.
2. Starts a local Convex backend in CI.
3. Starts a local Vite preview server from the built app.
4. Seeds test data.
5. Logs into the app.
6. Opens a large matrix of routes and UI states in Playwright.
7. Writes reviewed screenshots into `docs/design/specs/**`.

So this job is closer to:

- "capture a full visual state library for review"

than to:

- "run a few critical user-flow E2E tests"

## Why It Runs For So Long

It is expensive because it does all of this in one workflow:

- builds the app
- boots a local backend
- installs Playwright browsers
- seeds data
- captures many routes
- captures multiple states per route
- captures multiple viewport/theme configs

The configured matrix is:

- `desktop-dark`
- `desktop-light`
- `tablet-light`
- `mobile-light`

And the target set is large. The screenshot tool currently validates hundreds of screenshot outputs across public pages, empty states, and filled states.

That is why this job can run for a long time. It is not a quick smoke test.

## Why It Uses Shards

Sharding here means:

- split the screenshot target list across 4 parallel CI jobs
- each shard captures only part of the full screenshot matrix

It does **not** mean:

- parallel routes
- route-level product architecture
- anything inside TanStack Router

The workflow currently runs:

- `Screenshot Shard 1/4`
- `Screenshot Shard 2/4`
- `Screenshot Shard 3/4`
- `Screenshot Shard 4/4`

That exists because one giant screenshot job was too slow and too fragile. Splitting it across workers reduces wall-clock time and makes failures more local to a subset of captures.

The implementation lives in:

- [screenshots.yml](/home/mikhail/Desktop/cascade/.github/workflows/screenshots.yml)
- [screenshot-pages.ts](/home/mikhail/Desktop/cascade/e2e/screenshot-pages.ts)
- [sharding.ts](/home/mikhail/Desktop/cascade/e2e/screenshot-lib/sharding.ts)

## What The Screenshot Tool Does

The entrypoint is:

- [screenshot-pages.ts](/home/mikhail/Desktop/cascade/e2e/screenshot-pages.ts)

High level flow:

1. Parse CLI filters/shard flags.
2. Launch Chromium.
3. Seed screenshot data.
4. Capture empty states.
5. Capture public pages.
6. Capture filled authenticated states.
7. Write screenshots to a staging directory.
8. Promote staged output only if the run finishes cleanly.

This is why the tool is so much heavier than a normal Playwright spec.

## Why `PlateEditor.tsx` Has E2E Logic

The editor has a few test-only hooks because some visual states are hard to reach deterministically through the normal UI.

Current hooks in:

- [PlateEditor.tsx](/home/mikhail/Desktop/cascade/src/components/PlateEditor.tsx)

Current events:

- `nixelo:e2e-set-editor-markdown`
- `nixelo:e2e-set-editor-value`

These are used by the screenshot harness to inject specific editor content for reviewed visual states like:

- rich content
- mention popover
- slash menu
- floating toolbar

Without hooks like that, the screenshot job would need brittle keyboard choreography just to create stable editor states.

So the reason this code exists is:

- deterministic screenshot setup
- deterministic editor state setup
- less flaky than trying to simulate every rich-text interaction from scratch

## Why This Feels Scary

Your reaction is correct. It is scary because the test harness currently reaches into production components.

That has real downsides:

- production components now know about test-only window events
- screenshot logic leaks into app code
- it is harder to tell what is real product behavior vs harness setup
- failures are hard to reason about when the harness and component state interact badly

`PlateEditor.tsx` is not creating "parallel routes", but it **is** carrying screenshot-harness coupling inside a production component.

That coupling is exactly the part worth being suspicious of.

## What Is Intentional Vs What Is Not

Intentional:

- a separate screenshot workflow
- seeded visual-review states
- CI sharding for screenshot capture
- local Convex + built preview app in CI

Not ideal:

- production components listening for screenshot-only custom events
- screenshot state setup living inside route/component logic
- one workflow trying to serve as both visual baseline generation and CI gate
- long runtime from combining too much into one pipeline

## Why The Screenshot Manifest Validator Keeps Failing

The repo has a validator that checks for duplicate screenshot hashes.

The goal is to catch bad approvals such as:

- loading spinners
- blank app-shell captures
- identical captures for different named states

When the validator says a hash appears too many times, it usually means one of these happened:

1. a supposed interactive/modal state did not actually open
2. the harness captured the base page instead of the intended state
3. a loading shell or spinner got approved as a real state

That is why this area keeps surfacing in CI.

## Why The Current Screenshot Job Is Confusing

Right now the job mixes three concerns:

1. visual regression capture
2. screenshot-library maintenance
3. CI enforcement

That makes it hard to answer simple questions like:

- "is this a real test failure?"
- "is this just a spec screenshot mismatch?"
- "is this a harness bug?"

The answer is often "some combination of all three".

## Recommended Cleanup Direction

If we want this system to be easier to trust, the direction should be:

1. Keep a screenshot pipeline, but stop pretending it is the same thing as normal E2E coverage.
2. Move screenshot-only state setup out of production components where possible.
3. Prefer seeded route states over custom window-event hooks.
4. Keep only the smallest possible set of component-level hooks for states that truly cannot be seeded any other way.
5. Separate "capture screenshots" from "validate approved screenshot manifest" conceptually and in docs.

For `PlateEditor` specifically:

- content injection hooks are understandable
- broader modal/open-state hooks are where things start getting too invasive

## Short Version

The screenshot CI job is slow because it is not a simple test. It is a full visual-capture system running a big matrix of routes and states against a locally booted app. It is sharded because the matrix is too large for one worker. The `PlateEditor` E2E logic exists to make rich editor states deterministic, but it is also a real coupling point between test infrastructure and production code, so your discomfort is justified.
