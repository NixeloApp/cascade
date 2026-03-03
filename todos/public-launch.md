# Public Launch

> **Priority:** P3 (Post-MVP)
> **Effort:** Medium
> **Status:** Blocked (external launch operations required)

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

### 2026-03-02 (Batch B)

**Progress**

- Added demo-video production script and recording checklist:
  - `docs/launch/DEMO_VIDEO_SCRIPT.md`
- Added channel-ready copy drafts and launch-blog outline:
  - `docs/launch/CHANNEL_POST_DRAFTS.md`
- Updated `README.md` links to include launch prep assets.

**Decisions**

- Kept channel tasks unchecked until posts are actually published, but prepared exact copy in-repo so launch execution is operationally simple.
- Kept demo-video task unchecked until a recorded and published artifact exists.

**Blockers**

- Recording/publishing the demo video requires manual capture/edit/upload.
- Channel posting requires manual account actions and moderation review windows.

**Next step**

- Run the first manual launch wave: record the demo, publish one channel post (HN or Reddit), then feed outcomes back into this todo with links and engagement notes.

## Blocker Gate

Remaining unchecked items require repository-admin actions or external platform posting that cannot be completed from local code changes alone.

Unblock by providing:

- Published links for at least one launch channel post and demo video.
- Confirmation that GitHub Discussions is enabled and Discord is set up.
- Confirmation that `good first issue` labels were applied to starter issues.

### 2026-03-02 (Batch C)

**Progress**

- Reconfirmed Priority `16` remains blocked with no additional in-repo implementation remaining.

**Decisions**

- Kept all externally executed launch tasks unchecked until real published links/settings confirmations are provided.

**Blockers**

- Unchanged: external platform posting + repository-admin/community setup tasks.

**Next step**

- Continue strict order to Priority `17` while waiting for launch operation confirmations listed in the blocker gate.

### 2026-03-02 (Batch D)

**Progress**

- Revalidated repository-side launch prep remains stable and no additional local code/doc work is pending for this priority.

**Validation**

- `pnpm run typecheck` (pass)

**Decisions**

- Keep Priority `16` blocked until external launch operations produce verifiable links/config confirmations.

**Blockers**

- Unchanged external tasks:
  - publish demo video and channel posts,
  - enable Discussions / set up Discord,
  - apply starter `good first issue` labels.

**Next step**

- Continue strict order to Priority `17` while awaiting blocker-gate confirmations.

### 2026-03-02 (Batch E)

**Progress**

- Revalidated launch-prep repository state in strict-order flow; no additional local implementation tasks are pending.

**Validation**

- `pnpm run typecheck` (pass)

**Decisions**

- Keep Priority `16` blocked pending external launch operations and published evidence.

**Blockers**

- Unchanged external tasks:
  - publish demo video + launch-channel posts,
  - enable Discussions / set up Discord,
  - apply starter `good first issue` labels.

**Next step**

- Continue strict order to Priority `17` while awaiting blocker-gate confirmations.
