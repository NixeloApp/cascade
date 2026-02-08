# UI Slop Guide

> Do this, not that.

## Typography

```tsx
// ❌ Don't
<Typography variant="meta" as="span">{text}</Typography>
<Typography variant="h1" className="text-2xl font-bold mb-3">{title}</Typography>

// ✅ Do
<Metadata><MetadataItem>{text}</MetadataItem></Metadata>
<Typography variant="h1">{title}</Typography>
```

**Rules:**
- Never use `as="span"` - use Metadata, Badge, or plain text
- Never override size/weight with className - use correct variant
- Move spacing to parent `<Flex gap="...">`

## Inline Spans

```tsx
// ❌ Don't
<span className="text-xs text-ui-text-secondary">{text}</span>

// ✅ Do
<MetadataItem>{text}</MetadataItem>
// or
<Badge variant="secondary" size="sm">{text}</Badge>
// or just
{text}
```

## Metadata & Separators

```tsx
// ❌ Don't
<span>{time}</span>
<span>•</span>
<span>{author}</span>

// ✅ Do
<Metadata>
  <MetadataTimestamp date={time} />
  <MetadataItem>{author}</MetadataItem>
</Metadata>
```

## Timestamps

```tsx
// ❌ Don't
<span>{formatDate(date)}</span>

// ✅ Do
<MetadataTimestamp date={date} />
// or
<time dateTime={date.toISOString()}>{formatted}</time>
```

## Keyboard Shortcuts

```tsx
// ❌ Don't
<kbd className="bg-ui-bg border px-2 py-1 rounded">⌘K</kbd>

// ✅ Do
<KeyboardShortcut shortcut="cmd+K" />
```

## Icons

```tsx
// ❌ Don't
<span className="text-xl">🐛</span>
<Bug className="w-5 h-5" />

// ✅ Do
<Icon icon={Bug} size="md" />
<Icon icon={ISSUE_TYPE_ICONS[type]} size="lg" />
```

## Flex Layouts

```tsx
// ❌ Don't
<div className="flex items-center gap-2">

// ✅ Do
<Flex align="center" gap="sm">
```

## Required Fields

```tsx
// ❌ Don't
<label>Email <span className="text-status-error">*</span></label>

// ✅ Do
<Label required>Email</Label>
```

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

---

## Status

| Pattern | Status |
|---------|--------|
| Typography `as="span"` | ✅ Fixed |
| Emoji icons | ✅ Fixed |
| Keyboard shortcuts | ✅ Fixed |
| Required asterisks | ✅ Fixed |
| Raw flex divs | ✅ Mostly fixed |
| cmdk nested selectors | ⚠️ Low priority (vendor styling) |
| Dynamic label colors | ⚠️ Low priority (acceptable pattern) |
