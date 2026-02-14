# Settings Page - Implementation

> **Priority**: LOW (Phase 4 - Polish)
> **Scope**: Sidebar layout, form polish, danger zone
> **Estimated Complexity**: Medium

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/Settings/index.tsx` | REWRITE | Sidebar layout |
| `src/components/Settings/ProfileContent.tsx` | POLISH | Use SettingsField |
| `src/components/Settings/PreferencesTab.tsx` | POLISH | Consistent styling |
| `src/components/Settings/NotificationsTab.tsx` | POLISH | Cleaner toggle list |
| `src/components/Settings/GitHubIntegration.tsx` | ENHANCE | Use IntegrationCard |
| `src/components/Settings/GoogleCalendarIntegration.tsx` | ENHANCE | Use IntegrationCard |
| `src/routes/_auth/_app/$orgSlug/settings/profile.tsx` | ENHANCE | Support subroutes |

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/Settings/SettingsSidebar.tsx` | Vertical navigation |
| `src/components/Settings/SidebarGroup.tsx` | Section with label |
| `src/components/Settings/SidebarItem.tsx` | Navigation link |
| `src/components/Settings/SettingsField.tsx` | Field wrapper |
| `src/components/Settings/SaveButton.tsx` | Button with animation |
| `src/components/Settings/StatusBadge.tsx` | Connected/Disconnected |
| `src/components/Settings/DangerZone.tsx` | Red-bordered section |
| `src/components/Settings/IntegrationCard.tsx` | OAuth card pattern |

---

## Functionality Breakdown

### Navigation
- [x] Tab-based navigation
- [ ] **Enhancement**: Sidebar navigation
- [ ] **Enhancement**: URL-based routing per section
- [ ] **Enhancement**: Mobile hamburger menu

### Profile Section
- [x] Edit name/email
- [x] View stats
- [ ] **Enhancement**: Avatar upload
- [ ] **Enhancement**: Joined date display
- [ ] **Enhancement**: Field-level save buttons

### Preferences
- [x] Theme toggle
- [x] Timezone selector
- [x] Desktop notifications toggle
- [ ] **Polish**: Consistent field styling
- [ ] **Enhancement**: Accessibility settings

### Integrations
- [x] GitHub OAuth
- [x] Google Calendar
- [ ] **Polish**: Status badges
- [ ] **Polish**: Connection cards
- [ ] **Enhancement**: Sync status

### Danger Zone
- [ ] Delete account section
- [ ] Confirmation dialog
- [ ] Red-bordered styling

---

## Verification Checklist

### Phase 1: Sidebar Layout

- [ ] Create SettingsSidebar component
- [ ] Create SidebarGroup component
- [ ] Create SidebarItem component
- [ ] Update Settings/index.tsx to two-column
- [ ] Implement URL routing per section
- [ ] Style active state with brand-subtle bg
- [ ] Add keyboard navigation (↑/↓)

### Phase 2: Field Components

- [ ] Create SettingsField component
  - [ ] Label prop
  - [ ] Description prop
  - [ ] Children slot for input
  - [ ] Save button slot
- [ ] Create SaveButton component
  - [ ] Loading state
  - [ ] Success animation (green flash)
  - [ ] Error state
- [ ] Refactor ProfileContent to use SettingsField
- [ ] Refactor PreferencesTab to use SettingsField

### Phase 3: Integration Cards

- [ ] Create StatusBadge component
  - [ ] Connected (green)
  - [ ] Not Connected (gray)
  - [ ] Error (red)
- [ ] Create IntegrationCard component
  - [ ] Header with icon and status
  - [ ] Description text
  - [ ] Connection info (username, last sync)
  - [ ] Action buttons (Sync, Disconnect)
- [ ] Refactor GitHubIntegration
- [ ] Refactor GoogleCalendarIntegration

### Phase 4: Danger Zone

- [ ] Create DangerZone component
  - [ ] Red border styling
  - [ ] Warning icon
  - [ ] Bullet point consequences
  - [ ] Destructive button
- [ ] Create delete account confirmation dialog
- [ ] Implement account deletion mutation
- [ ] Add to profile section bottom

### Phase 5: Form Polish

- [ ] Consistent input styling
- [ ] Field descriptions under labels
- [ ] Focus ring on inputs
- [ ] Error state styling
- [ ] Success confirmation inline

### Phase 6: Responsive

- [ ] Mobile: Hamburger menu for sidebar
- [ ] Mobile: Full-width content
- [ ] Tablet: Narrow sidebar
- [ ] Touch-friendly toggle sizes

---

## Component Implementation

### SettingsSidebar

```tsx
interface SettingsSidebarProps {
  currentSection: string;
}

export function SettingsSidebar({ currentSection }: SettingsSidebarProps) {
  const { orgSlug } = Route.useParams();

  return (
    <aside className="w-60 border-r border-ui-border h-full overflow-y-auto">
      <nav className="p-4 space-y-6">
        <SidebarGroup label="Account">
          <SidebarItem
            href={ROUTES.settings.profile(orgSlug)}
            icon={UserIcon}
            active={currentSection === 'profile'}
          >
            Profile
          </SidebarItem>
          <SidebarItem
            href={ROUTES.settings.password(orgSlug)}
            icon={KeyIcon}
            active={currentSection === 'password'}
          >
            Password
          </SidebarItem>
          <SidebarItem
            href={ROUTES.settings.sessions(orgSlug)}
            icon={MonitorIcon}
            active={currentSection === 'sessions'}
          >
            Sessions
          </SidebarItem>
        </SidebarGroup>

        <SidebarGroup label="Preferences">
          <SidebarItem
            href={ROUTES.settings.appearance(orgSlug)}
            icon={PaletteIcon}
            active={currentSection === 'appearance'}
          >
            Appearance
          </SidebarItem>
          <SidebarItem
            href={ROUTES.settings.notifications(orgSlug)}
            icon={BellIcon}
            active={currentSection === 'notifications'}
          >
            Notifications
          </SidebarItem>
        </SidebarGroup>

        <SidebarGroup label="Integrations">
          <SidebarItem
            href={ROUTES.settings.github(orgSlug)}
            icon={GithubIcon}
            active={currentSection === 'github'}
          >
            GitHub
          </SidebarItem>
          <SidebarItem
            href={ROUTES.settings.calendar(orgSlug)}
            icon={CalendarIcon}
            active={currentSection === 'calendar'}
          >
            Calendar
          </SidebarItem>
        </SidebarGroup>

        <SidebarGroup label="Developer">
          <SidebarItem
            href={ROUTES.settings.apiKeys(orgSlug)}
            icon={KeyIcon}
            active={currentSection === 'api-keys'}
          >
            API Keys
          </SidebarItem>
        </SidebarGroup>
      </nav>

      <div className="p-4 border-t border-ui-border mt-auto">
        <SidebarItem href="/help" icon={HelpCircleIcon} external>
          Help
        </SidebarItem>
      </div>
    </aside>
  );
}
```

### SidebarGroup

```tsx
interface SidebarGroupProps {
  label: string;
  children: ReactNode;
}

export function SidebarGroup({ label, children }: SidebarGroupProps) {
  return (
    <div>
      <Typography
        variant="caption"
        className="px-3 py-2 text-xs font-semibold text-ui-text-tertiary uppercase tracking-wider"
      >
        {label}
      </Typography>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
```

### SidebarItem

```tsx
interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  active?: boolean;
  external?: boolean;
  children: ReactNode;
}

export function SidebarItem({ href, icon: Icon, active, external, children }: SidebarItemProps) {
  const Component = external ? 'a' : Link;

  return (
    <Component
      to={href}
      className={cn(
        "flex items-center gap-3 px-3 h-9 rounded-md text-sm",
        "transition-colors duration-150",
        active
          ? "bg-brand-subtle text-ui-text font-medium"
          : "text-ui-text-secondary hover:bg-ui-bg-secondary"
      )}
      {...(external && { target: "_blank", rel: "noopener" })}
    >
      <Icon className="w-4 h-4" />
      {children}
      {external && <ExternalLinkIcon className="w-3 h-3 ml-auto opacity-50" />}
    </Component>
  );
}
```

### SettingsField

```tsx
interface SettingsFieldProps {
  label: string;
  description?: string;
  error?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function SettingsField({ label, description, error, children, action }: SettingsFieldProps) {
  return (
    <div className="p-6 border border-ui-border rounded-lg bg-ui-bg-secondary">
      <div className="mb-4">
        <Typography variant="label" className="text-sm font-medium">
          {label}
        </Typography>
        {description && (
          <Typography variant="small" className="text-ui-text-secondary mt-1">
            {description}
          </Typography>
        )}
      </div>

      <Flex align="end" gap="md">
        <FlexItem flex="1">{children}</FlexItem>
        {action}
      </Flex>

      {error && (
        <Typography variant="small" className="text-status-error mt-2">
          {error}
        </Typography>
      )}
    </div>
  );
}
```

### SaveButton

```tsx
interface SaveButtonProps {
  onClick: () => void;
  loading?: boolean;
  success?: boolean;
  disabled?: boolean;
}

export function SaveButton({ onClick, loading, success, disabled }: SaveButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "transition-all duration-300",
        success && "bg-status-success animate-save-success"
      )}
    >
      {loading ? (
        <>
          <LoadingSpinner size="xs" className="mr-2" />
          Saving...
        </>
      ) : success ? (
        <>
          <CheckIcon className="w-4 h-4 mr-2" />
          Saved
        </>
      ) : (
        "Save"
      )}
    </Button>
  );
}
```

### StatusBadge

```tsx
type StatusBadgeVariant = 'connected' | 'disconnected' | 'error';

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children?: ReactNode;
}

const variants = {
  connected: {
    bg: 'bg-status-success-bg',
    border: 'border-status-success',
    text: 'text-status-success',
    dot: 'bg-status-success',
  },
  disconnected: {
    bg: 'bg-ui-bg-tertiary',
    border: 'border-ui-border',
    text: 'text-ui-text-secondary',
    dot: 'bg-ui-text-tertiary',
  },
  error: {
    bg: 'bg-status-error-bg',
    border: 'border-status-error',
    text: 'text-status-error',
    dot: 'bg-status-error',
  },
};

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  const styles = variants[variant];

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
      styles.bg,
      styles.border,
      styles.text,
      "border"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} />
      {children || (variant === 'connected' ? 'Connected' : variant === 'error' ? 'Error' : 'Not Connected')}
    </span>
  );
}
```

### IntegrationCard

```tsx
interface IntegrationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  username?: string;
  lastSync?: Date;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync?: () => void;
}

export function IntegrationCard({
  icon: Icon,
  title,
  description,
  status,
  username,
  lastSync,
  onConnect,
  onDisconnect,
  onSync,
}: IntegrationCardProps) {
  const isConnected = status === 'connected';

  return (
    <Card className="p-6">
      <Flex justify="between" align="start" className="mb-4">
        <Flex align="center" gap="md">
          <div className="w-10 h-10 rounded-lg bg-ui-bg-tertiary flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <Typography variant="label">{title}</Typography>
            <Typography variant="small" className="text-ui-text-secondary">
              {description}
            </Typography>
          </div>
        </Flex>
        <StatusBadge variant={status} />
      </Flex>

      {isConnected && (
        <div className="mb-4 p-3 bg-ui-bg-tertiary rounded-md">
          {username && (
            <Flex justify="between" className="mb-1">
              <Typography variant="caption">Connected as</Typography>
              <Typography variant="small" className="font-medium">@{username}</Typography>
            </Flex>
          )}
          {lastSync && (
            <Flex justify="between">
              <Typography variant="caption">Last synced</Typography>
              <Typography variant="small">{formatRelativeTime(lastSync)}</Typography>
            </Flex>
          )}
        </div>
      )}

      <Flex gap="sm" justify="end">
        {isConnected ? (
          <>
            {onSync && (
              <Button variant="secondary" size="sm" onClick={onSync}>
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Sync Now
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button onClick={onConnect}>
            Connect {title}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
```

### DangerZone

```tsx
interface DangerZoneProps {
  title: string;
  description: string;
  consequences?: string[];
  actionLabel: string;
  onAction: () => void;
  confirmText?: string;
}

export function DangerZone({
  title,
  description,
  consequences,
  actionLabel,
  onAction,
  confirmText,
}: DangerZoneProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [input, setInput] = useState('');

  const handleAction = () => {
    if (confirmText && input !== confirmText) return;
    onAction();
    setShowConfirm(false);
  };

  return (
    <>
      <div className="p-6 border-2 border-status-error rounded-lg bg-status-error-bg">
        <Flex align="start" gap="md" className="mb-4">
          <AlertTriangleIcon className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
          <div>
            <Typography variant="label" className="text-status-error">
              {title}
            </Typography>
            <Typography variant="small" className="text-ui-text-secondary mt-1">
              {description}
            </Typography>
          </div>
        </Flex>

        {consequences && consequences.length > 0 && (
          <ul className="mb-4 ml-9 space-y-1">
            {consequences.map((item, i) => (
              <li key={i} className="text-sm text-ui-text-secondary flex items-start gap-2">
                <span className="text-status-error">•</span>
                {item}
              </li>
            ))}
          </ul>
        )}

        <Flex justify="end">
          <Button variant="destructive" onClick={() => setShowConfirm(true)}>
            {actionLabel}
          </Button>
        </Flex>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. {description}
            </DialogDescription>
          </DialogHeader>

          {confirmText && (
            <div className="py-4">
              <Typography variant="small" className="mb-2">
                Type <code className="px-1 py-0.5 bg-ui-bg-tertiary rounded">{confirmText}</code> to confirm:
              </Typography>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={confirmText}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleAction}
              disabled={confirmText && input !== confirmText}
            >
              {actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## CSS Additions

```css
/* Sidebar item states */
.settings-sidebar-item {
  transition: background-color 0.15s ease, color 0.15s ease;
}

.settings-sidebar-item:hover {
  background-color: var(--color-ui-bg-secondary);
}

.settings-sidebar-item[data-active="true"] {
  background-color: var(--color-brand-subtle);
  color: var(--color-ui-text);
  font-weight: 500;
}

/* Save button success animation */
@keyframes save-success {
  0% { background-color: var(--color-brand); }
  50% { background-color: var(--color-status-success); transform: scale(1.02); }
  100% { background-color: var(--color-brand); transform: scale(1); }
}

.animate-save-success {
  animation: save-success 0.5s ease-out;
}

/* Settings field focus */
.settings-input:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px var(--color-brand-subtle);
}

/* Danger zone */
.danger-zone {
  border: 2px solid var(--color-status-error);
  background-color: var(--color-status-error-bg);
}

/* Status badge dot pulse */
@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-badge[data-status="connected"] .status-dot {
  animation: status-pulse 2s ease-in-out infinite;
}
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate
2. Test all settings sections
3. Test form validation
4. Test danger zone confirmation
5. Test responsive layout
6. Run `pnpm fixme` to verify no errors
7. Run `node scripts/validate.js` for design tokens
8. Update status in `DIRECTOR.md`

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark.png` | Current state |
| `screenshots/reference-linear-settings.png` | Linear reference |
| `screenshots/reference-github-settings.png` | GitHub reference |
