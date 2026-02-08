# Dropdown Component

> **Source**: `src/components/ui/DropdownMenu.tsx`, `src/components/ui/Select.tsx`
> **Animation Reference**: `docs/research/library/mintlify/landing_deep.json` (scaleIn/scaleOut)
> **Visual Reference**: `e2e/screenshots/10-filled-project-demo-board.png` (filter dropdowns)
> **Last Updated**: 2026-02-05

---

## Overview

The Dropdown component family provides contextual menus, selection interfaces, and nested navigation. Built on Radix UI primitives (`@radix-ui/react-dropdown-menu` and `@radix-ui/react-select`), these components handle positioning, keyboard navigation, and accessibility automatically.

**Key Principles**:
1. **Contextual actions** - Right-click menus, action buttons, filters
2. **Selection interfaces** - Single-select, multi-select via checkboxes
3. **Keyboard-first** - Full arrow key navigation, type-ahead search
4. **Accessible** - ARIA roles, focus management, screen reader support

---

## 1. Visual Reference

### Current Nixelo Implementation

From `e2e/screenshots/10-filled-project-demo-board.png`:

```
+------------------------------------------------------------------+
|  Demo Project   DEMO   kanban            Import / Export          |
|                                                                   |
|  [ Type  v ]  [ Priority  v ]  [ Assignee  v ]  [ Labels  v ]    |
|                                                                   |
|  Sprint Board                                                     |
|  +------------+  +------------+  +------------+  +------------+   |
|  | To Do    0 |  | In Prog  1 |  | In Review 1|  | Done     1 |   |
|  |            |  |            |  |            |  |            |   |
|  |            |  | DEMO-2     |  | DEMO-3     |  | DEMO-1     |   |
|  |            |  | Fix login..|  | Design new.|  | Set up CI..|   |
|  +------------+  +------------+  +------------+  +------------+   |
+------------------------------------------------------------------+
```

**Observations from screenshot**:
- Filter dropdowns appear in a horizontal row with consistent styling
- Each has a chevron icon indicating expandability
- Neutral background blends with page
- Compact sizing suitable for toolbars

### Dropdown Open State (Expected)

```
+------------------------------------------------------------------+
|  [ Type  v ]  [ Priority  v ]  [ Assignee  v ]  [ Labels  v ]    |
|               +----------------+                                  |
|               | Lowest         |                                  |
|               | Low            |                                  |
|               | Medium       * |  <-- Selected indicator          |
|               | High           |                                  |
|               | Highest        |                                  |
|               +----------------+                                  |
|                    ^ shadow                                       |
+------------------------------------------------------------------+
```

---

## 2. Variants

### 2.1 Simple Dropdown Menu

Standard menu for contextual actions (right-click, kebab menu).

```
+----------------------+
| Edit               > |
| Duplicate            |
| Move to...         > |
|----------------------|
| Archive              |
| Delete          [Del]|
+----------------------+
```

**Use cases**: Item actions, context menus, overflow menus

---

### 2.2 Select Dropdown

Single-selection dropdown with visual selected state.

```
+-----------------+
| Status        v |
+-----------------+
        |
        v
+-----------------+
|   To Do         |
| * In Progress   |  <-- Checkmark for selected
|   In Review     |
|   Done          |
+-----------------+
```

**Use cases**: Form fields, filters, settings

---

### 2.3 Multi-Select (Checkbox Items)

Multiple selections via checkbox indicators.

```
+--------------------+
| Labels          v  |
+--------------------+
         |
         v
+--------------------+
| [x] Bug            |
| [x] Frontend       |
| [ ] Backend        |
| [ ] Documentation  |
+--------------------+
```

**Use cases**: Tag selection, filter combinations, bulk actions

---

### 2.4 Radio Group

Mutually exclusive selection with radio indicators.

```
+--------------------+
| Priority        v  |
+--------------------+
         |
         v
+--------------------+
| ( ) Lowest         |
| ( ) Low            |
| (*) Medium         |  <-- Filled radio for selected
| ( ) High           |
| ( ) Highest        |
+--------------------+
```

**Use cases**: Priority selection, single-choice settings

---

### 2.5 Nested/Submenu

Hierarchical navigation with hover-triggered submenus.

```
+------------------+
| Edit           > |----+
| Move to...     > |    |  +----------------+
|------------------|    +->| Project Alpha  |
| Delete           |       | Project Beta   |
+------------------+       | Project Gamma  |
                           +----------------+
```

**Use cases**: Complex categorization, navigation trees, nested actions

---

### 2.6 With Keyboard Shortcuts

Items display keyboard shortcut hints.

```
+------------------------+
| Undo            Ctrl+Z |
| Redo            Ctrl+Y |
|------------------------|
| Cut             Ctrl+X |
| Copy            Ctrl+C |
| Paste           Ctrl+V |
+------------------------+
```

**Use cases**: Application menus, power user features

---

## 3. Anatomy

### DropdownMenu Anatomy

```
+--------------------------------------------------+
|                                                   |
|   [TRIGGER]  <-- Button that opens menu           |
|       |                                           |
|       v                                           |
|   +--------------------------------------+        |
|   |            MENU CONTAINER            |        |
|   |  (portal, floating, shadow/border)   |        |
|   |                                      |        |
|   |  +--------------------------------+  |        |
|   |  |      LABEL (optional)          |  |        |
|   |  |   (section header, muted)      |  |        |
|   |  +--------------------------------+  |        |
|   |                                      |        |
|   |  +--------------------------------+  |        |
|   |  | [ICON]  ITEM TEXT    [SHORTCUT]|  |        |
|   |  |  (optional)          (optional)|  |        |
|   |  +--------------------------------+  |        |
|   |                                      |        |
|   |  +--------------------------------+  |        |
|   |  |           SEPARATOR            |  |        |
|   |  |      (horizontal line)         |  |        |
|   |  +--------------------------------+  |        |
|   |                                      |        |
|   |  +--------------------------------+  |        |
|   |  | [CHECK/RADIO] ITEM     [>]     |  |        |
|   |  |  (indicator)          (submenu)|  |        |
|   |  +--------------------------------+  |        |
|   |                                      |        |
|   +--------------------------------------+        |
|                                                   |
+--------------------------------------------------+
```

### Component Parts

| Part | Element | Purpose |
|------|---------|---------|
| `DropdownMenu` | Root | State management (open/close) |
| `DropdownMenuTrigger` | Button | Opens the menu |
| `DropdownMenuPortal` | Portal | Renders outside DOM tree |
| `DropdownMenuContent` | Container | Menu box with items |
| `DropdownMenuItem` | Interactive | Clickable action item |
| `DropdownMenuCheckboxItem` | Interactive | Toggleable checkbox item |
| `DropdownMenuRadioGroup` | Container | Groups radio items |
| `DropdownMenuRadioItem` | Interactive | Mutually exclusive selection |
| `DropdownMenuLabel` | Text | Section header/title |
| `DropdownMenuSeparator` | Divider | Visual group separator |
| `DropdownMenuShortcut` | Text | Keyboard hint |
| `DropdownMenuSub` | Root | Submenu container |
| `DropdownMenuSubTrigger` | Interactive | Opens submenu |
| `DropdownMenuSubContent` | Container | Submenu panel |

---

## 4. ASCII Layout

### Desktop Layout

```
+--[ VIEWPORT ]----------------------------------------+
|                                                       |
|   +--[ TRIGGER (inline-flex) ]--+                    |
|   | Button Text            [v]  |                    |
|   +-----------------------------+                    |
|           |                                          |
|           | sideOffset: 4px                          |
|           v                                          |
|   +--[ CONTENT (z-50, min-w-32) ]----------------+   |
|   |                                               |   |
|   |  +--[ LABEL (px-2, py-1.5, font-semibold) ]--+|   |
|   |  | Actions                                   ||   |
|   |  +-------------------------------------------+|   |
|   |                                               |   |
|   |  +--[ ITEM (px-2, py-1.5, rounded-md) ]------+|   |
|   |  | [icon] Item text              [shortcut]  ||   |
|   |  +-------------------------------------------+|   |
|   |                                               |   |
|   |  +--[ SEPARATOR (-mx-1, my-1, h-px) ]--------+|   |
|   |  |=========================================  ||   |
|   |  +-------------------------------------------+|   |
|   |                                               |   |
|   |  +--[ CHECKBOX ITEM (pl-8, pr-2) ]-----------+|   |
|   |  | [*] Checked item                          ||   |
|   |  +-------------------------------------------+|   |
|   |                                               |   |
|   |  +--[ SUB TRIGGER ]-------------------------+|   |
|   |  | More options                         [>] ||---> Submenu
|   |  +-------------------------------------------+|   |
|   |                                               |   |
|   +-----------------------------------------------+   |
|                                                       |
+------------------------------------------------------+
```

### Submenu Position

```
+--[ PARENT MENU ]--------+     +--[ SUB MENU ]---------+
|                         |     |                       |
| Item 1                  |     | Sub item A            |
| Item 2                  |     | Sub item B            |
| More options        [>] |---->| Sub item C            |
| Item 3                  |     |                       |
|                         |     +----------------------+
+-------------------------+
           ^                           ^
      Parent menu              Submenu appears to the side
                               with slide-in animation
```

### Mobile Considerations

Dropdowns maintain same styling on mobile. For complex selections, consider using Sheet/Drawer on mobile viewports.

```
+--[ MOBILE VIEWPORT ]--+
|                       |
|  [ Filter    v ]      |
|         |             |
|         v             |
|  +------------------+ |
|  | Option A         | |
|  | Option B       * | |
|  | Option C         | |
|  | Option D         | |
|  +------------------+ |
|                       |
+-----------------------+
```

---

## 5. Styling Tokens

### Menu Container

| Property | Token/Class | Value |
|----------|-------------|-------|
| Background | `bg-ui-bg` | `light-dark(white, gray-900)` |
| Border | `border border-ui-border` | `light-dark(gray-200, gray-700)` |
| Border Radius | `rounded-lg` | `--radius: 8px` |
| Shadow | `shadow-md` / `shadow-lg` | `--shadow-elevated` |
| Padding | `p-1` | `4px` |
| Min Width | `min-w-32` | `128px` |
| Z-Index | `z-50` | Above content |
| Text Color | `text-ui-text` | `light-dark(gray-900, gray-50)` |

### Menu Item

| Property | Token/Class | Value |
|----------|-------------|-------|
| Padding | `px-2 py-1.5` | `8px horizontal, 6px vertical` |
| Border Radius | `rounded-md` | `--radius: 8px` |
| Font Size | `text-sm` | `14px` |
| Hover/Focus BG | `focus:bg-ui-bg-secondary` | Subtle highlight |
| Cursor | `cursor-default` | Pointer not needed (keyboard-first) |
| Transition | `transition-colors` | Smooth hover |

### Item Hover State

| Property | Token/Class | Value |
|----------|-------------|-------|
| Background | `bg-ui-bg-secondary` | `light-dark(gray-50, gray-800)` |
| Text | `text-ui-text` | No change (maintains readability) |

### Selected State (Checkbox/Radio)

| Property | Token/Class | Value |
|----------|-------------|-------|
| Indicator Position | `absolute left-2` | Fixed left position |
| Indicator Size | `h-3.5 w-3.5` | `14px` |
| Check Icon | `Check` from lucide | `h-4 w-4` |
| Radio Icon | `Circle` filled | `h-2 w-2 fill-current` |

### Disabled State

| Property | Token/Class | Value |
|----------|-------------|-------|
| Pointer Events | `data-[disabled]:pointer-events-none` | Non-interactive |
| Opacity | `data-[disabled]:opacity-50` | Dimmed |

### Separator

| Property | Token/Class | Value |
|----------|-------------|-------|
| Height | `h-px` | `1px` |
| Background | `bg-ui-border` | Subtle divider |
| Margins | `-mx-1 my-1` | Full width with vertical spacing |

### Label

| Property | Token/Class | Value |
|----------|-------------|-------|
| Padding | `px-2 py-1.5` | Matches items |
| Font Weight | `font-semibold` | `600` |
| Color | `text-ui-text` | Primary text |

### Shortcut

| Property | Token/Class | Value |
|----------|-------------|-------|
| Position | `ml-auto` | Right-aligned |
| Font Size | `text-xs` | `12px` |
| Tracking | `tracking-widest` | Spread letters |
| Color | `text-ui-text-tertiary` | Muted |

### Submenu Trigger

| Property | Token/Class | Value |
|----------|-------------|-------|
| Chevron | `ChevronRight ml-auto h-4 w-4` | Right arrow |
| Open State | `data-[state=open]:bg-ui-bg-secondary` | Highlight when open |

---

## 6. Animations

### Entry Animation: scaleIn (Mintlify-style)

From `landing_deep.json`:

```css
@keyframes scaleIn {
  0% {
    opacity: 0;
    transform: rotateX(-10deg) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: rotateX(0deg) scale(1);
  }
}
```

**Storyboard**:
```
Frame 0% (start)          Frame 50%              Frame 100% (end)
+----------------+        +----------------+      +----------------+
|                |   -->  |                |  --> |  +---------+   |
|                |        |  +-------+     |      |  | Menu    |   |
|  (invisible)   |        |  | Menu  |     |      |  | Items   |   |
|                |        |  +-------+     |      |  +---------+   |
|                |        |   (scaling)    |      |   (final)      |
+----------------+        +----------------+      +----------------+
   (96% scale,              (scaling up,           (100% scale,
    tilted back)             untilting)              flat)
```

### Exit Animation: scaleOut

```css
@keyframes scaleOut {
  0% {
    opacity: 1;
    transform: rotateX(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: rotateX(-10deg) scale(0.96);
  }
}
```

### Current Implementation (tailwindcss-animate)

```css
/* Entry */
data-[state=open]:animate-in
data-[state=open]:fade-in-0
data-[state=open]:zoom-in-95

/* Exit */
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=closed]:zoom-out-95

/* Directional slide based on opening side */
data-[side=bottom]:slide-in-from-top-2
data-[side=left]:slide-in-from-right-2
data-[side=right]:slide-in-from-left-2
data-[side=top]:slide-in-from-bottom-2
```

### Item Hover Animation

```css
/* Smooth background transition */
.dropdown-item {
  transition: background-color 150ms ease;
}

/* Focus creates instant highlight for keyboard users */
.dropdown-item:focus {
  background-color: var(--color-ui-bg-secondary);
}
```

### Submenu Animation

```css
/* Submenu slides in from trigger direction */
@keyframes slideInFromLeft {
  0% { opacity: 0; transform: translateX(-8px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* Applies to sub-content */
.dropdown-sub-content {
  animation: slideInFromLeft 0.15s ease-out;
}
```

### Target Implementation (Enhanced)

To achieve Mintlify-style polish, add to `src/index.css`:

```css
@theme {
  @keyframes dropdownScaleIn {
    0% {
      opacity: 0;
      transform: rotateX(-10deg) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: rotateX(0deg) scale(1);
    }
  }

  @keyframes dropdownScaleOut {
    0% {
      opacity: 1;
      transform: rotateX(0deg) scale(1);
    }
    100% {
      opacity: 0;
      transform: rotateX(-10deg) scale(0.96);
    }
  }

  --animation-dropdown-in: dropdownScaleIn 0.15s ease-out forwards;
  --animation-dropdown-out: dropdownScaleOut 0.1s ease-in forwards;
}

/* Apply custom animation */
[data-radix-popper-content-wrapper] [role="menu"] {
  transform-origin: var(--radix-dropdown-menu-content-transform-origin);
}
```

---

## 7. Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open menu (on trigger) / Select item |
| `ArrowDown` | Move focus to next item |
| `ArrowUp` | Move focus to previous item |
| `ArrowRight` | Open submenu (on subtrigger) |
| `ArrowLeft` | Close submenu |
| `Home` | Move focus to first item |
| `End` | Move focus to last item |
| `Escape` | Close menu |
| `Tab` | Close menu, move focus out |
| `a-z` | Jump to item starting with letter (type-ahead) |

### ARIA Attributes

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `role="menu"` | Content | Identifies as menu |
| `role="menuitem"` | Item | Standard menu item |
| `role="menuitemcheckbox"` | CheckboxItem | Toggleable item |
| `role="menuitemradio"` | RadioItem | Radio selection item |
| `aria-checked` | Checkbox/Radio | Selection state |
| `aria-haspopup="menu"` | SubTrigger | Indicates submenu |
| `aria-expanded` | SubTrigger | Submenu open state |
| `aria-disabled` | Any item | Disabled state |

### Focus Management

- **Initial focus**: First item receives focus when menu opens
- **Focus trap**: Focus stays within open menu
- **Return focus**: Focus returns to trigger on close
- **Visual indicator**: `focus:bg-ui-bg-secondary` shows current item

### Screen Reader Announcements

```tsx
// Label provides context for the menu
<DropdownMenuLabel>Actions</DropdownMenuLabel>

// Items are announced with their text
<DropdownMenuItem>Edit document</DropdownMenuItem>

// Shortcuts are announced
<DropdownMenuItem>
  Save
  <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
</DropdownMenuItem>

// Checkbox state is announced
<DropdownMenuCheckboxItem checked={true}>
  Show completed
</DropdownMenuCheckboxItem>
// Announced as: "Show completed, checked, menu item checkbox"
```

---

## 8. Code Examples

### Current Implementation

#### Basic Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";

function IssueActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-status-error">
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### Select Dropdown

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

function PrioritySelect({ value, onChange }: PrioritySelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Select priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="lowest">Lowest</SelectItem>
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="highest">Highest</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

#### Multi-Select with Checkboxes

```tsx
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

function LabelFilter({ labels, selectedIds, onToggle }: LabelFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Labels
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Filter by Label</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {labels.map((label) => (
          <DropdownMenuCheckboxItem
            key={label.id}
            checked={selectedIds.includes(label.id)}
            onCheckedChange={() => onToggle(label.id)}
          >
            <span
              className="mr-2 h-2 w-2 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            {label.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### Nested Submenu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

function MoveToProject({ projects, onMove }: MoveToProjectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderMove className="mr-2 h-4 w-4" />
            Move to project
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onMove(project.id)}
              >
                {project.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### Radio Group Selection

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

function StatusDropdown({ value, onChange }: StatusDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Status: {value}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Set Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuRadioItem value="todo">To Do</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="in-progress">In Progress</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="review">In Review</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="done">Done</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Target Implementation (Enhanced)

To add Mintlify-style polish, update the DropdownMenuContent component:

```tsx
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Base container styles
        "z-50 min-w-32 overflow-hidden",
        "rounded-lg border border-ui-border",
        "bg-ui-bg p-1 text-ui-text",

        // Enhanced shadow for elevation
        "shadow-elevated",

        // Entry animation (Mintlify-style with subtle tilt)
        "data-[state=open]:animate-in",
        "data-[state=open]:fade-in-0",
        "data-[state=open]:zoom-in-95",

        // Exit animation
        "data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0",
        "data-[state=closed]:zoom-out-95",

        // Directional slide based on opening position
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",

        // Duration
        "duration-150",

        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
```

### Enhanced Item with Hover Feedback

```tsx
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
  }
>(({ className, inset, variant = "default", ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      // Base styles
      "relative flex cursor-default select-none items-center",
      "rounded-md px-2 py-1.5 text-sm outline-none",

      // Smooth hover transition
      "transition-colors duration-100",

      // Focus/hover states
      "focus:bg-ui-bg-secondary focus:text-ui-text",

      // Variant: destructive
      variant === "destructive" && "text-status-error focus:text-status-error",

      // Disabled
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",

      // Inset for items without icons (align with icon items)
      inset && "pl-8",

      className,
    )}
    {...props}
  />
));
```

---

## 9. Usage Guidelines

### DO

- Use dropdown menus for contextual actions on items
- Use Select for form field selections
- Group related items with labels and separators
- Show keyboard shortcuts for power users
- Use checkbox items for multi-select scenarios
- Keep menu items concise (2-3 words)

### DON'T

- Don't nest more than 2 levels deep (submenu of submenu)
- Don't put critical actions only in dropdowns (provide alternatives)
- Don't use dropdowns for navigation (use proper nav components)
- Don't make dropdown content too wide (max ~300px)
- Don't include too many items (consider grouping or search)
- Don't use loading states in dropdowns (load data first)

### When to Use Each Variant

| Scenario | Variant |
|----------|---------|
| Right-click context menu | Simple Dropdown |
| Form field selection | Select Dropdown |
| Filtering by tags/labels | Multi-Select (Checkbox) |
| Status/priority selection | Radio Group |
| Complex categorization | Nested Submenu |
| Quick actions on item | Simple Dropdown |
| Toolbar overflow | Simple Dropdown |

### Alignment Guidelines

| Trigger Position | Recommended Align |
|------------------|-------------------|
| Left side of screen | `align="start"` |
| Right side of screen | `align="end"` |
| Center content | `align="center"` |
| Table row action | `align="end"` |
| Toolbar button | `align="start"` |

---

## 10. Related Components

- **Popover** - For rich content, not just menus
- **Dialog** - For complex interactions requiring focus
- **Command** - For searchable command palettes
- **Select** - For form field selections (subset of dropdown)
- **ContextMenu** - For right-click menus (similar API)
- **Tooltip** - For simple text hints (no interaction)

---

## 11. Props Quick Reference

### DropdownMenuContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sideOffset` | `number` | `4` | Gap between trigger and menu |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Horizontal alignment |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | Preferred side |
| `alignOffset` | `number` | `0` | Shift from alignment edge |
| `avoidCollisions` | `boolean` | `true` | Flip if overflows viewport |
| `className` | `string` | - | Additional CSS classes |

### DropdownMenuItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `inset` | `boolean` | `false` | Left padding for alignment |
| `disabled` | `boolean` | `false` | Disabled state |
| `onSelect` | `(event) => void` | - | Selection handler |
| `className` | `string` | - | Additional CSS classes |

### DropdownMenuCheckboxItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Checked state |
| `onCheckedChange` | `(checked) => void` | - | Change handler |
| `disabled` | `boolean` | `false` | Disabled state |

### SelectTrigger

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `placeholder` | `string` | - | Shown when no value |

---

*This document is part of the Nixelo Design System. See [MASTER_PLAN.md](../MASTER_PLAN.md) for the full design system overview.*
