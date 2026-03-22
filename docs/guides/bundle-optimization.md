# Bundle Size Optimization Guide

## 🎯 Goal: Reduce 2.34 MB bundle to < 1 MB

## Phase 1: Quick Wins (30-40% reduction)

### 1. Replace Lucide Icons with Optimized Imports

**Current (BAD):**
```typescript
import { Settings, User, Mail } from 'lucide-react'; // Imports entire library
```

**Optimized (GOOD):**
```typescript
// Install lucide-static for tree-shaking
// pnpm add lucide-static -D

// Or use direct imports (recommended)
import Settings from 'lucide-react/dist/esm/icons/settings';
import User from 'lucide-react/dist/esm/icons/user';
import Mail from 'lucide-react/dist/esm/icons/mail';
```

**Better: Create an icons barrel file**
```typescript
// src/lib/icons.ts
export { Settings } from 'lucide-react/dist/esm/icons/settings';
export { User } from 'lucide-react/dist/esm/icons/user';
export { Mail } from 'lucide-react/dist/esm/icons/mail';
// ... only import icons you actually use

// Then import from your barrel
import { Settings, User } from '@/lib/icons';
```

**Expected Savings:** ~80 KB

### 2. Lazy Load BlockNote Editor

**File:** Wherever DocumentEditor is used

```typescript
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load the editor
const DocumentEditor = lazy(() => import('@/components/DocumentEditor'));

// In your component
<Suspense fallback={<LoadingSpinner />}>
  <DocumentEditor />
</Suspense>
```

**Expected Savings:** ~400-500 KB (only loads when viewing documents)

### 3. Lazy Load PostHog Analytics

**File:** src/main.tsx or wherever PostHog is initialized

```typescript
// Don't import at top level
// import posthog from 'posthog-js';

// Instead, lazy load after initial render
useEffect(() => {
  // Load analytics after 2 seconds or on user interaction
  const timer = setTimeout(async () => {
    const { default: posthog } = await import('posthog-js');
    posthog.init(key, options);
  }, 2000);
  return () => clearTimeout(timer);
}, []);
```

**Expected Savings:** ~150 KB (deferred, not removed)

### 4. Lazy Load Driver.js (Tour Guide)

**File:** src/components/Onboarding/WelcomeTour.tsx

```typescript
import { useEffect, useState } from 'react';

export function WelcomeTour({ onComplete, onSkip }: WelcomeTourProps) {
  const [Driver, setDriver] = useState<any>(null);

  useEffect(() => {
    // Only load when tour is needed
    import('driver.js').then(({ driver }) => {
      import('driver.js/dist/driver.css'); // CSS too
      setDriver(() => driver);
    });
  }, []);

  useEffect(() => {
    if (!Driver) return;

    const driverObj = Driver({
      // ... config
    });

    // ... rest of logic
  }, [Driver]);

  return null;
}
```

**Expected Savings:** ~50 KB (only loads during onboarding)

### 5. Optimize Mantine Imports

**Current (BAD):**
```typescript
import { Button, TextInput } from '@mantine/core';
```

**Optimized (GOOD):**
```typescript
import { Button } from '@mantine/core/Button';
import { TextInput } from '@mantine/core/TextInput';
```

**Even Better: Consider replacing Mantine**
Mantine is heavy. Consider switching to:
- **Radix UI** (headless, ~50 KB total)
- **shadcn/ui** (copy-paste components, no bundle impact)
- **Tailwind + headless UI**

**Expected Savings:** ~100-150 KB

## Phase 2: Code Splitting (20-30% reduction)

### 6. Route-Based Code Splitting

**File:** src/App.tsx or router file

```typescript
import { lazy, Suspense } from 'react';

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectBoard = lazy(() => import('./pages/ProjectBoard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

// In your routes
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/project/:id" element={<ProjectBoard />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Suspense>
```

**Expected Savings:** ~300-400 KB (splits into route chunks)

### 7. Lazy Load Charts/Visualizations

If using recharts or other chart libraries:

```typescript
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));

// Only load when viewing analytics
{showAnalytics && (
  <Suspense fallback={<LoadingSpinner />}>
    <AnalyticsDashboard />
  </Suspense>
)}
```

## Phase 3: Dependency Optimization

### 8. Replace Heavy Dependencies

| Current | Replace With | Savings |
|---------|-------------|---------|
| `@mantine/core` (300 KB) | Radix UI + Tailwind (50 KB) | ~250 KB |
| `lucide-react` (100 KB) | Optimized imports | ~80 KB |
| `react-markdown` (80 KB) | Lazy load or use simpler parser | ~80 KB |
| `jszip` (50 KB) | Load only when needed | ~50 KB |

### 9. Remove Unused Dependencies

Run dependency analyzer:
```bash
pnpm dlx depcheck
```

Look for unused packages and remove them.

## Phase 4: Build Configuration

### 10. Use Optimized Vite Config

Replace your `vite.config.ts` with `vite.config.optimized.ts`:

```bash
mv vite.config.ts vite.config.old.ts
mv vite.config.optimized.ts vite.config.ts
```

### 11. Add Bundle Analysis Script

Add to `package.json`:
```json
{
  "scripts": {
    "build:analyze": "vite build --mode analyze",
    "build:report": "pnpm build && ls -lh dist/assets/*.js"
  }
}
```

Then run:
```bash
pnpm run build:analyze
```

This opens a visual bundle analyzer showing what's taking up space.

## Phase 5: Advanced Optimizations

### 12. Prefetch Critical Routes

```typescript
// Prefetch likely next page when user hovers
<Link
  to="/project"
  onMouseEnter={() => {
    import('./pages/ProjectBoard');
  }}
>
  View Project
</Link>
```

### 13. Use Web Workers for Heavy Tasks

Move CPU-intensive operations to Web Workers:
```typescript
// workers/analytics.worker.ts
self.onmessage = (e) => {
  const result = expensiveCalculation(e.data);
  self.postMessage(result);
};

// In component
const worker = new Worker(new URL('./workers/analytics.worker.ts', import.meta.url));
```

### 14. Enable Gzip/Brotli Compression

Already configured in `vite.config.optimized.ts`! This compresses your bundles before deployment.

## Testing Your Optimizations

### Before Each Change:
```bash
pnpm run build
```

Check the output:
```
dist/assets/index-x5_E_fJC.js       2,344.02 kB │ gzip: 675.58 kB
```

### After Each Change:
```bash
pnpm run build
```

You should see:
```
dist/assets/index-xxx.js            800.00 kB │ gzip: 280.00 kB  ✅
dist/assets/editor-xxx.js           400.00 kB │ gzip: 120.00 kB  (lazy)
dist/assets/analytics-xxx.js        150.00 kB │ gzip:  45.00 kB  (lazy)
```

## Expected Results

| Optimization | Bundle Reduction | Effort | Priority |
|--------------|------------------|--------|----------|
| Icon optimization | -80 KB | Low | High |
| Lazy load editor | -400 KB | Medium | High |
| Lazy load analytics | -150 KB | Low | High |
| Route splitting | -300 KB | Medium | High |
| Replace Mantine | -250 KB | High | Medium |
| Lazy load tour | -50 KB | Low | Medium |
| Optimize markdown | -80 KB | Medium | Medium |

**Total Expected Reduction:** 1,310 KB (55% smaller!)

## Implementation Order

1. ✅ Use optimized vite.config.ts (5 min)
2. ✅ Optimize icon imports (30 min)
3. ✅ Lazy load BlockNote editor (15 min)
4. ✅ Lazy load PostHog (10 min)
5. ✅ Lazy load Driver.js (10 min)
6. ⏳ Add route-based code splitting (1 hour)
7. ⏳ Consider replacing Mantine (2-4 hours)

## Monitoring

After optimizations, your bundle should be:
- Main bundle: < 1 MB (from 2.34 MB)
- Gzipped: < 300 KB (from 675 KB)
- Initial load: < 1.5s (from 3-4s)
- Lighthouse score: 90+ (from 60-70)

## Need Help?

Run the analyzer to see where your bytes are going:
```bash
pnpm run build:analyze
```

This will open a visual tree map showing your bundle composition.
