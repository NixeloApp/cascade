# Community Launch Runbook

Use this runbook for public launch preparation and channel execution.

## 1. Repository Readiness

- Issue templates:
  - `.github/ISSUE_TEMPLATE/bug-report.yml`
  - `.github/ISSUE_TEMPLATE/feature-request.yml`
  - `.github/ISSUE_TEMPLATE/config.yml`
- PR template:
  - `.github/PULL_REQUEST_TEMPLATE.md`
- Contributor docs:
  - `README.md`
  - `CONTRIBUTING.md`

## 2. `good first issue` Label Workflow

Run once with repo admin rights:

```bash
gh label create "good first issue" --color 7057ff --description "Well-scoped starter task for new contributors" --force
gh label create "help wanted" --color 008672 --description "Maintainers welcome community contributions" --force
```

Tag issues only when all criteria are true:

- Task is independently shippable in < 1 day.
- Reproduction and acceptance criteria are already written.
- Required files and modules are identified in issue body.
- At least one maintainer can review within 72 hours.

## 3. Community Surface Setup

Manual admin actions:

- Enable GitHub Discussions under repository settings.
- Create Discussion categories: `Q&A`, `Ideas`, `Show and Tell`, `Announcements`.
- Create Discord server with channels:
  - `#welcome`
  - `#support`
  - `#feature-requests`
  - `#contributing`
  - `#release-updates`
- Publish moderation guide and escalation owner rotation.

## 4. Channel Launch Checklist

- Hacker News:
  - Prepare `Show HN` title and first-comment context.
  - Include self-host instructions + demo GIF/video.
- Reddit:
  - Tailor copy for `r/selfhosted`, `r/opensource`, `r/programming`.
  - Follow each subreddit's link/self-post rules.
- Product Hunt:
  - Upload logo, gallery, teaser, and maker comment draft.
  - Pre-assign launch-day responder coverage.
- `awesome-selfhosted`:
  - Submit PR with concise product description and repo URL.
- Launch blog post:
  - Explain problem, architecture, hosting model, and roadmap.

## 5. Day-0 Triage

- 2-hour response SLA for launch-day bugs.
- Triage all inbound issues within 24 hours.
- Route reports into prioritized todo files with owner + next action.
