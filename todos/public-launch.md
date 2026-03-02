# Public Launch

> **Priority:** P3 (Post-MVP)
> **Effort:** Medium
> **Status:** In progress

---

## Tasks

### Polish

- [ ] **Demo video** - 2-3 min walkthrough showing key features
- [x] **Issue/PR templates** - GitHub templates for bug reports, feature requests
- [ ] **"Good first issue" labels** - Tag beginner-friendly issues for contributors

### Launch Channels

- [ ] **Hacker News** - "Show HN: Nixelo - Open-source Jira alternative with real-time collaboration"
- [ ] **Reddit** - Post to r/selfhosted, r/opensource, r/programming
- [ ] **Product Hunt** - Schedule launch, prepare assets
- [ ] **awesome-selfhosted** - Submit PR to add Nixelo
- [ ] **Launch blog post** - Write detailed post about why we built it

### Community

- [ ] **Discord server** - Set up with channels for support, feedback, dev
- [ ] **GitHub Discussions** - Enable for Q&A and feature requests

---

## Related Files

- `README.md` - Main documentation
- `.github/ISSUE_TEMPLATE/` - Issue templates
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S7+` (post-MVP launch phase)  
**Effort:** Medium

### Milestones

- [~] `S3` Launch asset prep (demo video, templates, messaging copy, screenshots)
- [ ] `S3` Community foundation (Discord + Discussions + moderation guidelines)
- [ ] `S4` Channel launch wave (HN/Reddit/Product Hunt/awesome-selfhosted/blog)
- [ ] `S4` Post-launch feedback triage and issue routing process

### Dependencies

- Stable onboarding experience for new self-hosted users
- Contributor docs quality (`README`, setup, issue templates)

### Definition of Done

- Launch campaign runs across all target channels with support workflow in place.

---

## Progress Log

### 2026-03-02 (Batch A)

**Progress**

- Added GitHub issue intake templates:
  - `.github/ISSUE_TEMPLATE/bug-report.yml`
  - `.github/ISSUE_TEMPLATE/feature-request.yml`
  - `.github/ISSUE_TEMPLATE/config.yml`
- Added launch/community operations runbook:
  - `docs/launch/COMMUNITY_LAUNCH_RUNBOOK.md`
- Updated contributor/docs surfaces to reference standardized intake:
  - `README.md`
  - `CONTRIBUTING.md`

**Decisions**

- Treated in-repo launch prep as Priority 16 implementation scope first (templates + runbook).
- Kept `good first issue` labeling as a manual admin operation but documented an exact `gh label create` command flow.

**Blockers**

- GitHub Discussions enablement requires repository admin settings change.
- Discord setup and all launch channels (HN/Reddit/Product Hunt/awesome-selfhosted/blog) require manual external execution.

**Next step**

- Execute the first external launch-op batch: enable Discussions, create starter categories, and apply `good first issue` + `help wanted` labels to an initial triage set.
