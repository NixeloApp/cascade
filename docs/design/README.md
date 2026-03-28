# Design System

## Docs

| Doc | Purpose |
|-----|---------|
| [STANDARDS.md](./STANDARDS.md) | Core principles (tokens, spacing, semantic HTML) |
| [CONSISTENCY.md](./CONSISTENCY.md) | Cross-cutting UI consistency contract + review loop |
| [PATTERNS.md](./PATTERNS.md) | Do this, not that (component usage) |
| [REFERENCE.md](./REFERENCE.md) | Token values & component inventory |
| [GAPS.md](./GAPS.md) | Actionable improvements (prioritized) |

## Specs

Detailed page and component breakdowns with ASCII wireframes:

- [specs/pages/](./specs/pages/) - Page-by-page analysis and current-state template
- [specs/components/](./specs/components/) - Component deep-dives
- [specs/modals/](./specs/modals/) - Modal and overlay specs

## Research

External reference material:

- [../research/library/mintlify/](../research/library/mintlify/) - Screenshots, CSS, animations

## Quick Start

```tsx
// Tokens
bg-ui-bg, text-ui-text, border-ui-border
bg-brand, text-status-error

// Composition
<Metadata>
  <MetadataItem>value</MetadataItem>
</Metadata>

<Flex align="center" gap="sm">
  <Icon icon={Bug} size="md" />
  <Typography variant="small">text</Typography>
</Flex>
```

## Validation

```bash
pnpm run validate  # Target: 0 errors
```

Visual work should also run:

```bash
pnpm screenshots -- --spec <spec-name>   # Capture specific pages
pnpm screenshots:diff                     # Compare against baseline
```

Use [CONSISTENCY.md](./CONSISTENCY.md) for the enforcement map: what is hard-failed by validators, what is advisory inventory, and what still requires human screenshot review.
