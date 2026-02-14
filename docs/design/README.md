# Design System

## Docs

| Doc | Purpose |
|-----|---------|
| [STANDARDS.md](./STANDARDS.md) | Core principles (tokens, spacing, semantic HTML) |
| [PATTERNS.md](./PATTERNS.md) | Do this, not that (component usage) |
| [REFERENCE.md](./REFERENCE.md) | Token values & component inventory |
| [GAPS.md](./GAPS.md) | Actionable improvements (prioritized) |

## Specs

Detailed page and component breakdowns with ASCII wireframes:

- [specs/pages/](./specs/pages/) - Page-by-page analysis
- [specs/components/](./specs/components/) - Component deep-dives

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
node scripts/validate.js  # Target: 0 errors
```
