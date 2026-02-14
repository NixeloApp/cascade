# UI Patterns

> Do this, not that. Component usage patterns to avoid AI-generated slop.

---

## Typography

```tsx
// ❌ Don't - override size/weight with className
<Typography variant="h1" className="text-2xl font-bold mb-3">{title}</Typography>

// ✅ Do - use correct variant, move spacing to parent
<Typography variant="h1">{title}</Typography>
```

**Rules:**
- Never override size/weight with className - use correct variant
- Move spacing to parent `<Flex gap="...">`

---

## Inline Text

```tsx
// ❌ Don't
<span className="text-xs text-ui-text-secondary">{text}</span>
<Typography variant="meta" as="span">{text}</Typography>

// ✅ Do
<MetadataItem>{text}</MetadataItem>
// or
<Badge variant="secondary" size="sm">{text}</Badge>
// or just
{text}
```

**Rules:**
- Never use `as="span"` - use Metadata, Badge, or plain text
- Never style raw `<span>` - use semantic components

---

## Metadata & Separators

```tsx
// ❌ Don't - manual separators
<span>{time}</span>
<span>•</span>
<span>{author}</span>

// ✅ Do - auto-separated
<Metadata>
  <MetadataTimestamp date={time} />
  <MetadataItem>{author}</MetadataItem>
</Metadata>
```

---

## Timestamps

```tsx
// ❌ Don't
<span>{formatDate(date)}</span>

// ✅ Do
<MetadataTimestamp date={date} />
// or
<time dateTime={date.toISOString()}>{formatted}</time>
```

---

## Keyboard Shortcuts

```tsx
// ❌ Don't
<kbd className="bg-ui-bg border px-2 py-1 rounded">⌘K</kbd>

// ✅ Do
<KeyboardShortcut shortcut="cmd+K" />
```

---

## Icons

```tsx
// ❌ Don't
<span className="text-xl">🐛</span>
<Bug className="w-5 h-5" />

// ✅ Do
<Icon icon={Bug} size="md" />
<Icon icon={ISSUE_TYPE_ICONS[type]} size="lg" />
```

---

## Flex Layouts

```tsx
// ❌ Don't
<div className="flex items-center gap-2">

// ✅ Do
<Flex align="center" gap="sm">
```

---

## Font Styles

```tsx
// ❌ Don't - font styles on raw elements
<span className="text-sm font-medium">{text}</span>
<div className="text-xs text-ui-text-secondary">{label}</div>

// ✅ Do - use Typography or appropriate UI component
<Typography variant="small">{text}</Typography>
<MetadataItem>{label}</MetadataItem>
```

---

## Required Fields

```tsx
// ❌ Don't
<label>Email <span className="text-status-error">*</span></label>

// ✅ Do
<Label required>Email</Label>
```

---

## Dynamic Colors

```tsx
// Acceptable - dynamic user data
<span style={{ backgroundColor: label.color }}>{label.name}</span>

// Better - if pattern repeats 3+ times, extract component
<LabelBadge color={label.color}>{label.name}</LabelBadge>
```

---

## Component Cheatsheet

| Instead of | Use |
|------------|-----|
| `<Typography as="span">` | `<MetadataItem>` or plain text |
| `<span className="...">` | `<Badge>`, `<MetadataItem>`, or plain text |
| Manual `•` separators | `<Metadata>` (auto-separates) |
| `<span>{date}</span>` | `<MetadataTimestamp>` or `<time>` |
| `<kbd className="...">` | `<KeyboardShortcut>` |
| Emoji strings | `<Icon icon={...}>` |
| `<div className="flex">` | `<Flex>` |
| `<span>*</span>` for required | `<Label required>` |
| `<span className="text-sm">` | `<Typography variant="small">` |
| `<div className="font-medium">` | `<Typography variant="label">` |

---

## Visual Design Anti-Patterns

These patterns make UI look "AI-generated" rather than professionally designed:

| AI Slop | Professional |
|---------|--------------|
| Card wrapper for everything | Content floats on background when appropriate |
| Verbose helper text everywhere | Minimal, self-explanatory UI |
| Emoji icons (🐛 📋 ⚡) | Proper icon library (Lucide) |
| "Back to home" links | Trust users know how to navigate |
| Long legal disclaimers | One line at bottom |
| Generic hero sections | Product preview, customer proof |
| Excessive padding/spacing | Tighter, more confident layouts |

---

## Validation

```bash
node scripts/validate.js
# Target: 0 errors
```

The validator checks for:
- Raw flex divs
- Raw Tailwind colors
- Arbitrary values
- Raw `data-testid` strings
