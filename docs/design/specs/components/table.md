# Table Component

> **Design System Documentation** | Last Updated: 2026-02-05

Tables display structured data in rows and columns, supporting sorting, selection, and inline actions. Used in admin panels, time tracking, and data-heavy views.

---

## Table of Contents

1. [Visual Reference](#visual-reference)
2. [Anatomy](#anatomy)
3. [Variants](#variants)
4. [Props/API](#propsapi)
5. [Styling Tokens](#styling-tokens)
6. [Features](#features)
7. [Animations](#animations)
8. [Accessibility](#accessibility)
9. [Code Examples](#code-examples)

---

## Visual Reference

### Current Nixelo

**Sources**:
- `e2e/screenshots/07-filled-time-tracking.png`
- `e2e/screenshots/18-filled-project-demo-timesheet.png`
- `src/components/Admin/UserManagement.tsx`

Current Nixelo uses two table patterns:

#### 1. Native HTML Tables (Admin/User Management)

```
Admin Table (User Management):
+------------------------------------------------------------------+
| HEADER ROW - bg-ui-bg-secondary                                   |
| px-6 py-3 | text-xs font-medium text-ui-text-secondary uppercase |
+------------------------------------------------------------------+
| BODY ROW - bg-ui-bg                                               |
| px-6 py-4 | text-sm text-ui-text                                  |
| divide-y divide-ui-border                                         |
+------------------------------------------------------------------+
```

Characteristics:
- **Header**: `bg-ui-bg-secondary` with uppercase text
- **Body**: `bg-ui-bg` with `divide-y divide-ui-border`
- **Cell padding**: `px-6 py-4` (generous)
- **Text size**: `text-xs` header, `text-sm` body
- **Responsive**: `overflow-x-auto` wrapper

#### 2. List-Based Tables (Time Tracking)

```
Time Entries List:
+------------------------------------------------------------------+
| DATE HEADER - text-sm text-ui-text-secondary                      |
| Feb 3, 2026                                 3h 30m                |
+------------------------------------------------------------------+
| ENTRY ROW - bg-ui-bg border border-ui-border rounded-lg          |
| p-3 hover:bg-ui-bg-tertiary transition-colors                     |
|                                                                   |
| Task Title                                  Duration  Actions     |
| [Badge] [Project] [Billable]                2h 30m    [Delete]    |
|                                             $375.00               |
+------------------------------------------------------------------+
```

Characteristics:
- Grouped by date with date headers
- Card-like rows within date groups
- Inline badges for metadata
- Right-aligned duration and cost
- Hover state with `bg-ui-bg-tertiary`

### Mintlify Reference

**Source**: `docs/research/library/mintlify/pricing_desktop_dark.png`

Mintlify pricing comparison tables exhibit:

- **No visible borders**: Relies on spacing and typography hierarchy
- **Ultra-subtle row dividers**: Nearly invisible separators
- **Clean checkmarks**: Simple iconography for feature presence
- **Generous vertical padding**: Large row heights for scannability
- **Sticky headers**: Column headers remain visible while scrolling
- **Muted text colors**: Secondary content at 60-70% opacity

---

## Anatomy

### ASCII Structure - Native Table

```
+==============================================================================+
| TABLE CONTAINER                                                               |
| overflow-x-auto (enables horizontal scroll on small screens)                  |
+==============================================================================+

+==============================================================================+
| THEAD - bg-ui-bg-secondary                                                    |
+------------------------------------------------------------------------------+
| TH              | TH              | TH              | TH         | TH        |
| [sort icon]     | [sort icon]     |                 |            | (actions) |
| px-6 py-3       | text-xs         | uppercase       | tracking-  | text-     |
|                 | font-medium     |                 | wider      | right     |
+==============================================================================+

+==============================================================================+
| TBODY - bg-ui-bg divide-y divide-ui-border                                   |
+------------------------------------------------------------------------------+
| TD              | TD              | TD              | TD         | TD        |
| [checkbox]      | [avatar+name]   | [text]          | [badge]    | [actions] |
| [hover:bg-ui-bg-tertiary]                                                     |
+------------------------------------------------------------------------------+
| TD              | TD              | TD              | TD         | TD        |
| [selected row: bg-brand-subtle]                                               |
+------------------------------------------------------------------------------+
| ...more rows...                                                               |
+==============================================================================+

+==============================================================================+
| TFOOT (optional) - Pagination/Summary                                        |
| flex justify-between items-center p-4                                        |
| [showing X of Y]                        [< Prev] [1] [2] [3] [Next >]        |
+==============================================================================+
```

### ASCII Structure - List Table (Time Tracking Pattern)

```
+==============================================================================+
| DATE GROUP HEADER                                                             |
| flex justify-between                                                          |
| Feb 3, 2026                                                     3h 30m       |
| text-sm text-ui-text-secondary                                               |
+==============================================================================+

+------------------------------------------------------------------------------+
| ENTRY CONTAINER - bg-ui-bg border border-ui-border rounded-lg                |
| divide-y divide-ui-border                                                     |
+------------------------------------------------------------------------------+
|                                                                               |
| ENTRY ROW - p-3 hover:bg-ui-bg-tertiary transition-colors group              |
| +-------------------------------------------------------------------------+  |
| | LEFT SECTION (flex-1)                          | RIGHT SECTION          |  |
| | Title                                          | Duration (font-bold)   |  |
| | [Badge] [Project] [Billable]                   | Cost (text-secondary)  |  |
| +-------------------------------------------------------------------------+  |
|                                                                               |
+------------------------------------------------------------------------------+
|                                                                               |
| ENTRY ROW - ...                                                               |
|                                                                               |
+------------------------------------------------------------------------------+
```

### Component Parts

| Part | Purpose | Default Classes |
|------|---------|-----------------|
| `TableWrapper` | Horizontal scroll container | `overflow-x-auto` |
| `Table` | Table element | `min-w-full divide-y divide-ui-border` |
| `TableHead` | Header section | `bg-ui-bg-secondary` |
| `TableHeadCell` | Header cell | `px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider` |
| `TableBody` | Body section | `bg-ui-bg divide-y divide-ui-border` |
| `TableRow` | Body row | `hover:bg-ui-bg-tertiary transition-colors` |
| `TableCell` | Body cell | `px-6 py-4 whitespace-nowrap text-sm text-ui-text` |
| `TableFooter` | Footer section | `p-4 border-t border-ui-border` |

---

## Variants

### 1. Default Table

Standard data table with visible header and row dividers.

```
STRUCTURE:
+------------------------------------------------+
| HEADER      | HEADER      | HEADER    | HEADER  |
| bg-ui-bg-secondary                              |
+------------------------------------------------+
| Cell        | Cell        | Cell      | Cell    |
+------------------------------------------------+
| Cell        | Cell        | Cell      | Cell    |
+------------------------------------------------+
| Cell        | Cell        | Cell      | Cell    |
+------------------------------------------------+
```

**Usage**: Admin panels, user management, data exports

### 2. Compact Table

Reduced padding for high-density data.

```
DIFFERENCES FROM DEFAULT:
- Header: px-4 py-2 (instead of px-6 py-3)
- Cells: px-4 py-2 (instead of px-6 py-4)
- Text: text-xs (instead of text-sm)
```

**Usage**: Analytics dashboards, dense reports

### 3. Striped Rows

Alternating row backgrounds for visual scanning.

```
STRUCTURE:
+------------------------------------------------+
| HEADER      | HEADER      | HEADER    | HEADER  |
+------------------------------------------------+
| Row (bg-ui-bg)                                  |
+------------------------------------------------+
| Row (bg-ui-bg-secondary)        <- alternating  |
+------------------------------------------------+
| Row (bg-ui-bg)                                  |
+------------------------------------------------+
| Row (bg-ui-bg-secondary)                        |
+------------------------------------------------+
```

**Implementation**: `even:bg-ui-bg-secondary` on `<tr>`

**Usage**: Long tables, financial data, logs

### 4. Hoverable Rows

Interactive rows with hover feedback.

```
STATES:
+------------------------------------------------+
| Default: bg-ui-bg                               |
+------------------------------------------------+
| Hover: bg-ui-bg-tertiary                        |
|        cursor-pointer (if clickable)            |
+------------------------------------------------+
| Selected: bg-brand-subtle                       |
|           border-l-2 border-brand (optional)    |
+------------------------------------------------+
```

**Usage**: Clickable row navigation, selectable lists

### 5. Grouped List (Time Tracking Style)

Card-based rows grouped by category (e.g., date).

```
STRUCTURE:
+------------------------------------------------+
| GROUP HEADER                         SUMMARY    |
| (date, category)                     (totals)   |
+------------------------------------------------+

+[CARD]------------------------------------------+
| Row 1 content                        Duration   |
| [metadata badges]                    Cost       |
+------------------------------------------------+
| Row 2 content                        Duration   |
+------------------------------------------------+
+------------------------------------------------+

+------------------------------------------------+
| NEXT GROUP HEADER                    SUMMARY    |
+------------------------------------------------+
...
```

**Usage**: Time entries, activity feeds, grouped logs

---

## Props/API

### Table Component (Target)

```typescript
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  variant?: "default" | "compact" | "striped";
  hoverable?: boolean;
  stickyHeader?: boolean;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "compact" \| "striped"` | `"default"` | Table density/style variant |
| `hoverable` | `boolean` | `true` | Enable row hover states |
| `stickyHeader` | `boolean` | `false` | Sticky header on scroll |

### TableHeadCell Component

```typescript
interface TableHeadCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sortable` | `boolean` | `false` | Shows sort indicator, enables click |
| `sortDirection` | `"asc" \| "desc" \| null` | `null` | Current sort state |
| `onSort` | `function` | - | Sort toggle handler |

### TableRow Component

```typescript
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  onClick?: () => void;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selected` | `boolean` | `false` | Selected state styling |
| `onClick` | `function` | - | Row click handler |

---

## Styling Tokens

### Current Implementation Tokens

| Property | Token | Value (Light) | Value (Dark) |
|----------|-------|---------------|--------------|
| Header Background | `bg-ui-bg-secondary` | `#F9FAFB` (gray-50) | `#1F2937` (gray-800) |
| Body Background | `bg-ui-bg` | `#FFFFFF` | `#111827` (gray-900) |
| Row Hover | `bg-ui-bg-tertiary` | `#F3F4F6` (gray-100) | `#374151` (gray-700) |
| Row Divider | `divide-ui-border` | `#E5E7EB` (gray-200) | `#374151` (gray-700) |
| Header Text | `text-ui-text-secondary` | `#6B7280` (gray-500) | `#D1D5DB` (gray-300) |
| Body Text | `text-ui-text` | `#111827` (gray-900) | `#F9FAFB` (gray-50) |
| Secondary Text | `text-ui-text-secondary` | `#6B7280` (gray-500) | `#D1D5DB` (gray-300) |
| Selected Row | `bg-brand-subtle` | `#EEF2FF` (indigo-50) | `#1E1B4B` (indigo-950) |

### Cell Padding Standards

| Variant | Header | Body |
|---------|--------|------|
| Default | `px-6 py-3` | `px-6 py-4` |
| Compact | `px-4 py-2` | `px-4 py-2` |

### Mintlify-Inspired Enhancements

For premium polish, consider these refinements:

| Property | Current | Mintlify-Inspired | Notes |
|----------|---------|-------------------|-------|
| Row Divider | `border-ui-border` | `rgba(255,255,255,0.05)` (dark) | Ultra-subtle |
| Header Border | Visible divider | No border, use background | Cleaner look |
| Row Spacing | `py-4` | `py-5` | More breathing room |
| Hover Transition | `transition-colors` | `transition-all duration-150` | Smoother |

### Proposed New Tokens

```css
/* Add to @theme in src/index.css */

/* Table-specific surfaces */
--color-table-header-bg: light-dark(
  var(--p-gray-50),
  rgba(255, 255, 255, 0.03)
);

--color-table-row-hover: light-dark(
  var(--p-gray-50),
  rgba(255, 255, 255, 0.02)
);

--color-table-row-selected: light-dark(
  var(--p-indigo-50),
  rgba(99, 102, 241, 0.1)
);

/* Ultra-subtle row divider */
--color-table-divider: light-dark(
  var(--p-gray-100),
  rgba(255, 255, 255, 0.05)
);
```

---

## Features

### Sorting Indicators

```
HEADER CELL WITH SORTING:
+---------------------------+
| Column Name  [sort icon]  |
|              ^            |
|              ChevronUp    |
|              (ascending)  |
+---------------------------+

SORT STATES:
- Unsorted:    ChevronUpDown (neutral, muted)
- Ascending:   ChevronUp (active color)
- Descending:  ChevronDown (active color)
```

**Implementation**:
```tsx
<TableHeadCell sortable sortDirection="asc" onSort={() => toggleSort("column")}>
  Column Name
</TableHeadCell>
```

### Selection Checkboxes

```
ROW SELECTION:
+---+--------------------------------------------+
| [ ] | Row content without selection            |
+---+--------------------------------------------+
| [x] | Row content with selection (highlighted) |
|     | bg-brand-subtle, left border accent      |
+---+--------------------------------------------+

HEADER WITH SELECT ALL:
+---+--------------------------------------------+
| [x] | Select all (indeterminate when partial)  |
+---+--------------------------------------------+
```

**Checkbox States**:
- Unchecked: Empty box
- Checked: Filled with checkmark
- Indeterminate: Dash (for "select all" with partial selection)

### Row Actions

```
INLINE ACTIONS (right-aligned):
+----------------------------------------+-------+
| Row content                            | [...] |
|                                        |   ^   |
|                                        | Menu  |
+----------------------------------------+-------+

HOVER ACTIONS (visible on hover):
+----------------------------------------+-------------+
| Row content                            | [Edit][Del] |
|                                        |  (visible   |
|                                        |  on hover)  |
+----------------------------------------+-------------+
```

**Implementation Options**:
1. Always visible dropdown menu (`...`)
2. Hover-reveal action buttons
3. Combination: primary action visible, secondary in menu

### Pagination Footer

```
PAGINATION LAYOUT:
+-------------------------------------------------------------+
| Showing 1-10 of 42 results      [< Prev] [1][2][3] [Next >] |
|                                                              |
| text-sm text-ui-text-secondary  Button components            |
+-------------------------------------------------------------+
```

---

## Animations

### Row Hover Transition

Smooth background color change on hover.

```css
/* Row hover */
transition: background-color 0.15s ease;

tr:hover {
  background-color: var(--color-ui-bg-tertiary);
}
```

### Sort Transition

Indicator rotation and color change.

```css
/* Sort icon transition */
.sort-icon {
  transition: transform 0.2s ease, color 0.2s ease;
}

/* Rotate on direction change */
.sort-icon.descending {
  transform: rotate(180deg);
}

/* Highlight active sort */
.sort-icon.active {
  color: var(--color-brand);
}
```

### Row Selection Transition

Highlight transition when selecting rows.

```css
/* Selection state */
tr {
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

tr.selected {
  background-color: var(--color-brand-subtle);
  border-left: 2px solid var(--color-brand);
}
```

### Row Entry Animation

Staggered fade-in for table rows on load.

```css
/* Keyframe (defined in @theme) */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Row entry */
tbody tr {
  animation: fade-in 0.3s ease-out;
  animation-fill-mode: both;
}

tbody tr:nth-child(1) { animation-delay: 0ms; }
tbody tr:nth-child(2) { animation-delay: 50ms; }
tbody tr:nth-child(3) { animation-delay: 100ms; }
/* ...stagger continues */
```

---

## Accessibility

### Semantic Structure

Tables must use proper HTML table elements:

```html
<table aria-label="User list">
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Email</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>john@example.com</td>
      <td>Active</td>
    </tr>
  </tbody>
</table>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between interactive elements (buttons, checkboxes) |
| `Enter`/`Space` | Activate focused element (checkbox, sort button) |
| `Arrow Up/Down` | Move between rows (if roving tabindex implemented) |

### ARIA Attributes

| Element | Attribute | Value | Purpose |
|---------|-----------|-------|---------|
| `<table>` | `aria-label` | Description of table | Announces table purpose |
| `<th>` | `scope="col"` | Column header | Associates header with column |
| `<th>` | `aria-sort` | `"ascending" \| "descending" \| "none"` | Announces sort state |
| Sortable `<th>` | `role="button"` | - | Indicates clickability |
| Checkbox | `aria-label` | `"Select row"` | Describes checkbox purpose |
| Select all | `aria-label` | `"Select all rows"` | Describes bulk action |

### Focus Management

```css
/* Focus indicators */
th[role="button"]:focus-visible,
td button:focus-visible,
td input[type="checkbox"]:focus-visible {
  outline: 2px solid var(--color-ui-border-focus);
  outline-offset: 2px;
}
```

### Color Contrast

- Header text: 4.5:1 minimum contrast ratio
- Body text: 4.5:1 minimum contrast ratio
- Status badges: 3:1 non-text contrast
- Selection indicator: Visible without relying solely on color

---

## Code Examples

### Current Implementation (Native HTML)

From `src/components/Admin/UserManagement.tsx`:

```tsx
// Table wrapper
<div className="overflow-x-auto">
  <table
    className="min-w-full divide-y divide-ui-border"
    aria-label="User invitations"
  >
    {/* Header */}
    <thead className="bg-ui-bg-secondary">
      <tr>
        <th
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
        >
          Email
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider">
          Role
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider">
          Status
        </th>
        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-ui-text-secondary uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>

    {/* Body */}
    <tbody className="bg-ui-bg divide-y divide-ui-border">
      {invites.map((invite) => (
        <tr key={invite._id}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text">
            {invite.email}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <Badge variant="neutral">{invite.role}</Badge>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <Badge variant={getStatusVariant(invite.status)}>
              {invite.status}
            </Badge>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <Flex justify="end" gap="sm">
              <Button variant="ghost" size="sm">Resend</Button>
              <Button variant="ghost" size="sm">Revoke</Button>
            </Flex>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Current Implementation (List Table - Time Tracking)

From `src/components/TimeTracking/TimeEntriesList.tsx`:

```tsx
{groupedEntries.map(({ date, entries: dateEntries, duration }) => (
  <div key={date} className="space-y-3">
    {/* Date header */}
    <Flex justify="between" align="end" className="text-sm text-ui-text-secondary px-1">
      <span className="font-medium">{formatDate(new Date(date).getTime())}</span>
      <span>{formatDurationDisplay(duration)}</span>
    </Flex>

    {/* Entry rows in card */}
    <div className="bg-ui-bg border border-ui-border rounded-lg divide-y divide-ui-border">
      {dateEntries.map((entry) => (
        <Flex
          align="start"
          gap="md"
          className="p-3 hover:bg-ui-bg-tertiary transition-colors group"
          key={entry._id}
        >
          {/* Details */}
          <div className="flex-1 min-w-0">
            <Typography className="text-sm font-medium text-ui-text">
              {entry.description}
            </Typography>
            <Flex align="center" gap="md" className="mt-1 text-xs text-ui-text-secondary">
              {entry.activity && <Badge variant="neutral">{entry.activity}</Badge>}
              {entry.project && (
                <Flex align="center" gap="xs" className="inline-flex">
                  <Folder className="w-3 h-3" />
                  {entry.project.name}
                </Flex>
              )}
              {entry.billable && <Badge variant="success">Billable</Badge>}
            </Flex>
          </div>

          {/* Duration and cost */}
          <div className="shrink-0 text-right">
            <div className="text-sm font-semibold text-ui-text">
              {formatDurationDisplay(entry.duration)}
            </div>
            {entry.totalCost !== undefined && entry.totalCost > 0 && (
              <div className="text-xs text-ui-text-secondary">
                {formatCurrency(entry.totalCost, entry.currency)}
              </div>
            )}
          </div>

          {/* Actions (visible on hover) */}
          <div className="shrink-0">
            <Button
              onClick={() => handleDelete(entry._id)}
              variant="ghost"
              size="sm"
              className="p-1 min-w-0 text-ui-text-tertiary hover:text-status-error"
              aria-label="Delete entry"
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </Flex>
      ))}
    </div>
  </div>
))}
```

### Target Implementation (Componentized Table)

```tsx
// Table component with variants
import { cn } from "@/lib/utils";

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  variant?: "default" | "compact" | "striped";
  hoverable?: boolean;
  stickyHeader?: boolean;
}

export function Table({
  variant = "default",
  hoverable = true,
  stickyHeader = false,
  className,
  children,
  ...props
}: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "min-w-full divide-y divide-ui-border",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

// Table Head
export function TableHead({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("bg-ui-bg-secondary", className)} {...props}>
      {children}
    </thead>
  );
}

// Table Head Cell with sorting
interface TableHeadCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
  align?: "left" | "center" | "right";
}

export function TableHeadCell({
  sortable,
  sortDirection,
  onSort,
  align = "left",
  className,
  children,
  ...props
}: TableHeadCellProps) {
  return (
    <th
      scope="col"
      className={cn(
        "px-6 py-3 text-xs font-medium text-ui-text-secondary uppercase tracking-wider",
        align === "left" && "text-left",
        align === "center" && "text-center",
        align === "right" && "text-right",
        sortable && "cursor-pointer hover:text-ui-text select-none",
        className
      )}
      onClick={sortable ? onSort : undefined}
      role={sortable ? "button" : undefined}
      aria-sort={sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : undefined}
      {...props}
    >
      <Flex align="center" gap="xs" className="inline-flex">
        {children}
        {sortable && (
          <SortIcon direction={sortDirection} />
        )}
      </Flex>
    </th>
  );
}

// Sort Icon
function SortIcon({ direction }: { direction?: "asc" | "desc" | null }) {
  if (direction === "asc") {
    return <ChevronUp className="w-4 h-4 text-brand" />;
  }
  if (direction === "desc") {
    return <ChevronDown className="w-4 h-4 text-brand" />;
  }
  return <ChevronsUpDown className="w-4 h-4 text-ui-text-tertiary" />;
}

// Table Body
export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("bg-ui-bg divide-y divide-ui-border", className)} {...props}>
      {children}
    </tbody>
  );
}

// Table Row
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  hoverable?: boolean;
}

export function TableRow({ selected, hoverable = true, className, children, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        hoverable && "hover:bg-ui-bg-tertiary transition-colors",
        selected && "bg-brand-subtle border-l-2 border-brand",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

// Table Cell
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

export function TableCell({ align = "left", className, children, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "px-6 py-4 whitespace-nowrap text-sm text-ui-text",
        align === "left" && "text-left",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

// Table Footer
export function TableFooter({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot className={cn("p-4 border-t border-ui-border", className)} {...props}>
      {children}
    </tfoot>
  );
}
```

### Target Usage Example

```tsx
import {
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
} from "@/components/ui/Table";

function UserManagementTable({ users }: { users: User[] }) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <Table aria-label="User management">
      <TableHead>
        <tr>
          <TableHeadCell className="w-12">
            <Checkbox
              checked={selectedIds.size === users.length}
              indeterminate={selectedIds.size > 0 && selectedIds.size < users.length}
              onChange={toggleSelectAll}
              aria-label="Select all users"
            />
          </TableHeadCell>
          <TableHeadCell
            sortable
            sortDirection={sortColumn === "name" ? sortDirection : null}
            onSort={() => toggleSort("name")}
          >
            User
          </TableHeadCell>
          <TableHeadCell
            sortable
            sortDirection={sortColumn === "email" ? sortDirection : null}
            onSort={() => toggleSort("email")}
          >
            Email
          </TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell align="right">Actions</TableHeadCell>
        </tr>
      </TableHead>

      <TableBody>
        {users.map((user) => (
          <TableRow
            key={user._id}
            selected={selectedIds.has(user._id)}
            onClick={() => navigate(ROUTES.userDetail(user._id))}
            className="cursor-pointer"
          >
            <TableCell>
              <Checkbox
                checked={selectedIds.has(user._id)}
                onChange={() => toggleSelect(user._id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${user.name}`}
              />
            </TableCell>
            <TableCell>
              <Flex align="center" gap="sm">
                <Avatar src={user.image} name={user.name} size="sm" />
                <span className="font-medium">{user.name}</span>
              </Flex>
            </TableCell>
            <TableCell className="text-ui-text-secondary">
              {user.email}
            </TableCell>
            <TableCell>
              <Badge variant={user.isActive ? "success" : "neutral"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell align="right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Actions">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Deactivate</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-status-error">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <tr>
          <td colSpan={5}>
            <Flex justify="between" align="center">
              <Typography variant="body-sm" color="secondary">
                Showing 1-10 of {users.length} users
              </Typography>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </Flex>
          </td>
        </tr>
      </TableFooter>
    </Table>
  );
}
```

---

## Related Documentation

- [MASTER_PLAN.md](../MASTER_PLAN.md) - Overall design system roadmap
- [tokens/colors.md](../tokens/colors.md) - Color token reference
- [tokens/animations.md](../tokens/animations.md) - Animation patterns
- [components/card.md](./card.md) - Card component (similar container patterns)
- [components/button.md](./button.md) - Button component (used in actions)
- [src/components/Admin/UserManagement.tsx](../../../src/components/Admin/UserManagement.tsx) - Current table implementation

---

## Implementation Checklist

- [ ] Create `Table` component with variants (default, compact, striped)
- [ ] Add `TableHead`, `TableBody`, `TableFooter` wrapper components
- [ ] Add `TableHeadCell` with sorting support
- [ ] Add `TableRow` with selection state
- [ ] Add `TableCell` with alignment props
- [ ] Add `--color-table-header-bg` token to `src/index.css`
- [ ] Add `--color-table-row-hover` token with subtle opacity
- [ ] Add `--color-table-divider` token (ultra-subtle)
- [ ] Implement sort icon component with transitions
- [ ] Add row selection checkbox pattern
- [ ] Add pagination footer component
- [ ] Add row entry animation (staggered fade-in)
- [ ] Test hover and selection states in dark mode
- [ ] Verify keyboard navigation and ARIA attributes
- [ ] Update UserManagement to use new Table components
- [ ] Update TimeEntriesList pattern documentation
