# Design Reference

> Current state. Updated as code changes.

## Tokens (from `src/index.css`)

### Colors - Surfaces

| Token | Class | Light | Dark |
|-------|-------|-------|------|
| `--color-ui-bg` | `bg-ui-bg` | white | `#08090a` |
| `--color-ui-bg-secondary` | `bg-ui-bg-secondary` | gray-50 | `#0f1011` |
| `--color-ui-bg-tertiary` | `bg-ui-bg-tertiary` | gray-100 | `#161718` |
| `--color-ui-bg-elevated` | `bg-ui-bg-elevated` | white | `#0f1011` |
| `--color-ui-bg-soft` | `bg-ui-bg-soft` | gray-50 | `rgba(255,255,255,0.03)` |
| `--color-ui-bg-hover` | `bg-ui-bg-hover` | gray-100 | `rgba(255,255,255,0.05)` |

### Colors - Text

| Token | Class | Light | Dark |
|-------|-------|-------|------|
| `--color-ui-text` | `text-ui-text` | gray-900 | `#ffffff` |
| `--color-ui-text-secondary` | `text-ui-text-secondary` | gray-500 | `rgba(255,255,255,0.7)` |
| `--color-ui-text-tertiary` | `text-ui-text-tertiary` | gray-400 | `rgba(255,255,255,0.5)` |

### Colors - Borders

| Token | Class | Light | Dark |
|-------|-------|-------|------|
| `--color-ui-border` | `border-ui-border` | gray-200 | `rgba(255,255,255,0.07)` |
| `--color-ui-border-secondary` | `border-ui-border-secondary` | gray-300 | `rgba(255,255,255,0.15)` |

### Colors - Brand

| Token | Class | Light | Dark |
|-------|-------|-------|------|
| `--color-brand` | `bg-brand`, `text-brand` | indigo-600 | indigo-400 |
| `--color-brand-hover` | `hover:bg-brand-hover` | indigo-700 | indigo-300 |
| `--color-brand-subtle` | `bg-brand-subtle` | indigo-50 | indigo-950 |

### Colors - Status

| Token | Class |
|-------|-------|
| `--color-status-success` | `text-status-success`, `bg-status-success` |
| `--color-status-warning` | `text-status-warning`, `bg-status-warning` |
| `--color-status-error` | `text-status-error`, `bg-status-error` |
| `--color-status-info` | `text-status-info`, `bg-status-info` |

### Shadows

| Token | Value |
|-------|-------|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)` |
| `--shadow-elevated` | `0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)` |

### Border Radius

| Token | Value |
|-------|-------|
| `--radius` | 8px |
| `--radius-secondary` | 4px |
| `--radius-container` | 12px |
| `--radius-lg` | 16px |
| `--radius-pill` | 9999px |

### Transitions

| Token | Value |
|-------|-------|
| `--duration-fast` | 0.15s |
| `--duration-default` | 0.2s |
| `--duration-slow` | 0.3s |

---

## Components (src/components/ui/)

### Layout
- `Flex` - Flexbox container with gap/align/justify props
- `Card` - Container with shadow and padding
- `Separator` - Horizontal/vertical divider
- `ScrollArea` - Custom scrollbar container
- `Resizable` - Resizable panels

### Typography
- `Typography` - Semantic text (h1-h6, p, blockquote, etc.)
- `Label` - Form labels

### Forms
- `Button` - All button variants
- `Input` - Text input
- `Textarea` - Multi-line input
- `Select` - Dropdown select
- `Checkbox` - Checkbox input
- `RadioGroup` - Radio buttons
- `Switch` - Toggle switch
- `Slider` - Range slider
- `ColorPicker` - Color selection
- `Form` - Form wrapper with validation
- `FormDialog` - Form in a dialog

### Feedback
- `Alert` - Alert messages
- `AlertDialog` - Confirmation dialogs
- `ConfirmDialog` - Simple confirm/cancel
- `Dialog` - Modal dialogs
- `Sheet` - Side panel
- `Tooltip` - Hover tooltips
- `HoverCard` - Rich hover content
- `Popover` - Positioned popover
- `Sonner` - Toast notifications
- `Progress` - Progress bar
- `Skeleton` - Loading placeholder
- `LoadingSpinner` - Spinner animation

### Navigation
- `Breadcrumb` - Breadcrumb trail
- `DropdownMenu` - Dropdown menus
- `ContextMenu` - Right-click menu
- `Menubar` - Menu bar
- `NavigationMenu` - Navigation links
- `ShadcnTabs` - Tabbed interface
- `Pagination` - Page navigation
- `Command` - Command palette (⌘K)

### Data Display
- `Avatar` - User avatar
- `Badge` - Status/label badges
- `Table` - Data tables
- `Accordion` - Expandable sections
- `Collapsible` - Collapsible content
- `Calendar` - Date picker
- `Carousel` - Image carousel

### Composition (New)
- `Metadata` - Auto-separated inline metadata
- `MetadataItem` - Single metadata value
- `MetadataTimestamp` - Semantic `<time>` element
- `ListItem` - Structured list item (icon/title/subtitle/meta)
- `UserDisplay` - Avatar + name + subtitle
- `CollapsibleHeader` - Header with icon/badge/chevron slots
- `EmptyState` - Empty state with icon and CTA
- `EntityCard` - Card for entities (projects, issues, etc.)

---

## Refactoring Status

Files using new composition patterns:

| File | Status | Pattern Used |
|------|--------|--------------|
| `MeetingRecordingSection.tsx` | ✅ Done | `Metadata`, `Collapsible` |
| `IssueDependencies.tsx` | ✅ Done | `IssueDisplay` helper |
| `GlobalSearch.tsx` | 🔄 Partial | Needs cleanup |
| `NotificationBell.tsx` | ❌ TODO | - |
| `LabelsManager.tsx` | ❌ TODO | - |
