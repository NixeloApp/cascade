# Component Documentation Standards

> When to use each component, common patterns, and anti-patterns.

---

## Layout Components

### Flex

**When to use:** Any horizontal or vertical layout with items.

```tsx
// Row with centered items and gap
<Flex align="center" gap="sm">
  <Icon icon={User} />
  <Typography>Name</Typography>
</Flex>

// Column layout
<Flex direction="column" gap="md">
  <Header />
  <Content />
</Flex>
```

**Props:** `direction`, `align`, `justify`, `gap`, `wrap`

**Anti-patterns:**
- `<div className="flex">` - use Flex component
- `className="gap-4"` on Flex - use `gap="md"` prop

---

### Stack

**When to use:** Vertical-only layouts (shorthand for `<Flex direction="column">`).

```tsx
<Stack gap="sm">
  <Input />
  <Input />
  <Button>Submit</Button>
</Stack>
```

---

### Card

**When to use:** Grouping related content with visual boundary.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Clickable card
<Card onClick={handleClick} role="button">
  <CardContent>Click me</CardContent>
</Card>
```

**Variants:** `default`, `flat`, `outline`

**Anti-patterns:**
- Wrapping everything in cards - let content breathe
- Nested cards - flatten hierarchy

---

## Typography

### Typography

**When to use:** All text content with semantic meaning.

| Variant | Use for |
|---------|---------|
| `h1` | Page titles |
| `h2` | Section headers |
| `h3` | Card titles |
| `body` | Paragraphs (default) |
| `small` | Secondary info |
| `label` | Form labels, emphasized text |
| `meta` | Timestamps, counts |

```tsx
<Typography variant="h2">Section Title</Typography>
<Typography color="secondary">Helper text</Typography>
```

**Anti-patterns:**
- `<p>`, `<h1>`, `<span>` with className - use Typography
- `className="text-sm font-medium"` - use correct variant

---

### Metadata / MetadataItem / MetadataTimestamp

**When to use:** Inline metadata with automatic separators.

```tsx
<Metadata>
  <MetadataTimestamp date={createdAt} />
  <MetadataItem>{author}</MetadataItem>
  <MetadataItem>{status}</MetadataItem>
</Metadata>
// Renders: "2 hours ago • John • Open"
```

**Anti-patterns:**
- Manual `•` separators
- `<span>{date}</span>` - use MetadataTimestamp

---

## Form Components

### Button

**When to use:** Actions that trigger something.

| Variant | Use for |
|---------|---------|
| `default` | Primary actions |
| `secondary` | Secondary actions |
| `outline` | Less prominent actions |
| `ghost` | Tertiary/inline actions |
| `destructive` | Delete/dangerous actions |

```tsx
<Button onClick={save}>Save</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="destructive">Delete</Button>
```

**Anti-patterns:**
- Button without accessible label for icon-only buttons
- Using `<a>` styled as button - use Button with `asChild`

---

### IconButton

**When to use:** Icon-only buttons (always requires aria-label).

```tsx
<IconButton icon={X} aria-label="Close" onClick={close} />
<IconButton icon={Edit} aria-label="Edit item" variant="ghost" />
```

---

### Input / Textarea

**When to use:** Text entry fields.

```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" placeholder="you@example.com" />

<Label htmlFor="bio">Bio</Label>
<Textarea id="bio" rows={4} />
```

**Anti-patterns:**
- Input without associated Label
- Placeholder as label replacement

---

### Select

**When to use:** Choosing from predefined options.

```tsx
<Select value={status} onValueChange={setStatus}>
  <SelectTrigger>
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="open">Open</SelectItem>
    <SelectItem value="closed">Closed</SelectItem>
  </SelectContent>
</Select>
```

---

### Checkbox / Switch

**When to use:** Boolean toggles.

- **Checkbox:** Multiple selections, form fields
- **Switch:** On/off settings, immediate effect

```tsx
<Checkbox checked={agreed} onCheckedChange={setAgreed} />
<Switch checked={enabled} onCheckedChange={setEnabled} />
```

---

## Feedback Components

### Badge

**When to use:** Status indicators, counts, labels.

```tsx
<Badge>New</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="destructive">Error</Badge>
```

---

### LoadingSpinner

**When to use:** Async operations, data fetching.

```tsx
// Inline loading
<LoadingSpinner size="sm" />

// Full section loading
<LoadingSpinner size="lg" label="Loading issues..." />
```

---

### EmptyState

**When to use:** No data to display.

```tsx
<EmptyState
  icon={Inbox}
  title="No issues"
  description="Create your first issue to get started"
  action={<Button onClick={create}>Create Issue</Button>}
/>
```

**Anti-patterns:**
- Just showing blank space
- Only text without visual anchor

---

### Alert

**When to use:** Important messages that need attention.

```tsx
<Alert variant="warning">
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>This action cannot be undone.</AlertDescription>
</Alert>
```

---

## Overlay Components

### Dialog

**When to use:** Modal interactions requiring user decision.

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent size="md">
    <DialogHeader>
      <DialogTitle>Confirm</DialogTitle>
    </DialogHeader>
    <DialogFooter>
      <Button variant="ghost" onClick={close}>Cancel</Button>
      <Button onClick={confirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Sizes:** `sm`, `md`, `lg`, `xl`, `2xl`, `full`

---

### DropdownMenu

**When to use:** Contextual actions on hover/click.

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <IconButton icon={MoreHorizontal} aria-label="Actions" />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={edit}>Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={del} className="text-status-error">
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Tooltip

**When to use:** Additional context on hover (non-essential info).

```tsx
<Tooltip content="Copy to clipboard">
  <IconButton icon={Copy} aria-label="Copy" />
</Tooltip>
```

**Anti-patterns:**
- Essential info in tooltip (not accessible)
- Tooltip on touch-only elements

---

## Data Display

### Avatar

**When to use:** User/entity representation.

```tsx
<Avatar src={user.image} fallback={user.name} size="md" />
<AvatarGroup max={3}>
  {users.map(u => <Avatar key={u.id} src={u.image} fallback={u.name} />)}
</AvatarGroup>
```

---

### Icon

**When to use:** Visual indicators, decorative elements.

```tsx
<Icon icon={Bug} size="sm" />
<Icon icon={CheckCircle} size="md" color="success" />
```

**Sizes:** `xs`, `sm`, `md`, `lg`, `xl`

**Anti-patterns:**
- Emoji icons - use Lucide icons
- Inconsistent icon sizes - use size prop

---

## Component Selection Flowchart

```
Need to display text?
├─ Heading/title → Typography variant="h1/h2/h3"
├─ Body text → Typography (default)
├─ Small/secondary → Typography variant="small"
├─ Inline metadata → MetadataItem or Badge
└─ Timestamp → MetadataTimestamp

Need user interaction?
├─ Primary action → Button
├─ Secondary action → Button variant="secondary/ghost"
├─ Icon-only action → IconButton (with aria-label!)
├─ Toggle on/off → Switch
├─ Multiple choice → Checkbox
└─ Select from list → Select or DropdownMenu

Need layout?
├─ Row or column → Flex
├─ Vertical stack → Stack
├─ Grouped content → Card
└─ Grid of items → CSS Grid (no component)

Need feedback?
├─ Loading → LoadingSpinner
├─ Empty → EmptyState
├─ Status/count → Badge
├─ Important message → Alert
└─ Additional context → Tooltip
```

---

## General Rules

1. **Accessibility first** - all interactive elements need accessible names
2. **Use semantic variants** - don't override with className
3. **Props over classes** - `gap="sm"` not `className="gap-2"`
4. **Consistent sizing** - use size props (`sm`, `md`, `lg`)
5. **Color through props** - `color="secondary"` not `className="text-gray-500"`
