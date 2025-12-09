# UI/UX Completion Blueprint - Claw Master V3

## Document Information
- **Project**: Claw Master V3 - Arcade Inventory & Settings Tracker
- **Created**: December 9, 2024
- **Version**: 1.0.0

---

## 1. Design System Overview

### Current Implementation

| Element | Status | Notes |
|---------|--------|-------|
| Color Palette | ✅ Complete | Tailwind + shadcn/ui |
| Typography | ✅ Complete | System fonts |
| Spacing | ✅ Complete | Tailwind scale |
| Components | ✅ Complete | 31 shadcn/ui components |
| Icons | ✅ Complete | Lucide React |
| Dark Mode | ✅ Complete | next-themes |

### shadcn/ui Components Available

| Category | Components |
|----------|------------|
| Layout | Card, Separator, Sheet, Collapsible |
| Forms | Button, Input, Textarea, Select, Checkbox, Switch, Radio, Label |
| Feedback | Alert, AlertDialog, Dialog, Progress, Skeleton, Sonner (Toast) |
| Navigation | Tabs, DropdownMenu, Command, Popover |
| Data Display | Badge, Avatar, Table, Tooltip, Calendar |
| Utility | ScrollArea, ToggleGroup |

---

## 2. Missing Pages & Sub-pages

### 2.1 Placeholder Pages (Need Full Implementation)

#### `/monitoring` - Real-time Monitoring

**Current State**: Placeholder with "Coming Soon"

**Required Implementation**:

```
Monitoring Page Layout
├── Header
│   ├── Title "Real-time Monitoring"
│   ├── Filters (Location, Status)
│   └── View Toggle (Grid/List)
├── Alert Panel (Collapsible)
│   ├── Critical Alerts (Red)
│   ├── Warning Alerts (Yellow)
│   └── Info Alerts (Blue)
├── Machine Status Grid
│   ├── Machine Card (x N)
│   │   ├── Machine Name
│   │   ├── Status Indicator (Pulse animation)
│   │   ├── Current Voltage
│   │   ├── Play Count (Today)
│   │   ├── Win Rate
│   │   └── Quick Actions
│   └── Empty State (if no machines)
└── Footer
    ├── Last Sync Time
    └── Connection Status
```

**Wireframe Description**:
- Grid of machine cards with real-time status
- Each card shows live telemetry data
- Pulse animation for online machines
- Error highlighting for problem machines
- Alert banner at top for urgent issues

---

### 2.2 Incomplete Pages (Need Enhancement)

#### `/team` - Team Management

**Current Gaps**:
- Invite button doesn't work
- No role editing
- No member removal
- No activity per member

**Required Additions**:

```
Team Page Enhancements
├── Invite Modal
│   ├── Email Input
│   ├── Role Select
│   └── Send Invite Button
├── Member Card Enhancements
│   ├── Role Dropdown (editable)
│   ├── Last Active
│   ├── Actions Menu
│   │   ├── View Activity
│   │   ├── Edit Role
│   │   └── Remove Member
│   └── Status Badge (Active/Invited/Inactive)
└── Pending Invites Section
    └── Invited User Cards with Resend/Cancel
```

---

#### `/stock-check` - Weekly Stock Check

**Current Gaps**:
- Basic form only
- No history view
- No discrepancy reporting

**Required Additions**:

```
Stock Check Enhancements
├── Tabs
│   ├── New Check
│   │   ├── Location Selector
│   │   ├── Item Checklist
│   │   │   ├── Item Row
│   │   │   │   ├── Item Details
│   │   │   │   ├── Expected Qty
│   │   │   │   ├── Actual Qty Input
│   │   │   │   └── Discrepancy Flag
│   │   └── Submit Button
│   └── History
│       ├── Check List
│       │   ├── Date
│       │   ├── Completed By
│       │   ├── Discrepancies Count
│       │   └── Status Badge
│       └── Check Detail View
└── Discrepancy Report Dialog
```

---

### 2.3 New Pages Needed

#### Error Pages

**404 Page**:
```
not-found.tsx
├── Illustration (Lost Machine)
├── "Page Not Found" Heading
├── Description Text
└── "Go Home" Button
```

**Error Page**:
```
error.tsx
├── Illustration (Broken Machine)
├── "Something Went Wrong" Heading
├── Error Message (optional)
├── "Try Again" Button
└── "Go Home" Button
```

#### Loading Page
```
loading.tsx
├── Full-page skeleton
└── Animated loader
```

---

## 3. Component Library Gaps

### 3.1 Missing Common Components

| Component | Purpose | Priority |
|-----------|---------|----------|
| Breadcrumb | Navigation context | P0 |
| EmptyState | Empty data views | P0 |
| LoadingSkeleton | Loading placeholders | P0 |
| PageHeader | Consistent page headers | P1 |
| StatCard | Dashboard metrics | P1 |
| DataTable | Sortable/filterable tables | P1 |
| StatusBadge | Status indicators | P2 |
| ActionMenu | Row action dropdowns | P2 |

### 3.2 Component Specifications

#### Breadcrumb Component

```typescript
// src/components/ui/breadcrumb.tsx
interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    icon?: LucideIcon;
  }>;
}

// Usage
<Breadcrumb 
  items={[
    { label: 'Home', href: '/' },
    { label: 'Inventory', href: '/inventory' },
    { label: 'Pokemon Plush' }, // Current page
  ]}
/>
```

#### EmptyState Component

```typescript
// src/components/common/EmptyState.tsx
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Usage
<EmptyState 
  icon={Package}
  title="No items found"
  description="Try adjusting your filters or add a new item"
  action={{
    label: "Add Item",
    onClick: () => setShowAddDialog(true)
  }}
/>
```

#### LoadingSkeleton Component

```typescript
// src/components/common/LoadingSkeleton.tsx
interface LoadingSkeletonProps {
  variant: 'card' | 'table' | 'list' | 'detail';
  count?: number;
}

// Usage
<LoadingSkeleton variant="card" count={6} />
```

---

## 4. Responsive Design Checklist

### Breakpoints

| Breakpoint | Pixels | Usage |
|------------|--------|-------|
| xs | < 640px | Mobile phones |
| sm | ≥ 640px | Large phones |
| md | ≥ 768px | Tablets |
| lg | ≥ 1024px | Laptops |
| xl | ≥ 1280px | Desktops |
| 2xl | ≥ 1536px | Large monitors |

### Page Responsiveness Status

| Page | Mobile | Tablet | Desktop | Notes |
|------|--------|--------|---------|-------|
| Dashboard | 🟡 | ✅ | ✅ | Cards stack well |
| Inventory | 🟡 | ✅ | ✅ | Grid adapts |
| Item Detail | 🟡 | ✅ | ✅ | Needs mobile layout |
| Machines | ✅ | ✅ | ✅ | Good |
| Orders | 🟡 | ✅ | ✅ | Kanban needs horizontal scroll |
| Maintenance | 🟡 | ✅ | ✅ | Same as orders |
| Analytics | ❌ | 🟡 | ✅ | Charts need mobile optimization |
| Settings | 🟡 | ✅ | ✅ | Tabs work |
| Account | ✅ | ✅ | ✅ | Good |

### Required Mobile Optimizations

1. **Analytics Page**
   - Stack charts vertically on mobile
   - Simplify data tables
   - Hide less critical metrics

2. **Kanban Boards (Orders/Maintenance)**
   - Horizontal scroll with snap
   - Or: Dropdown to switch columns

3. **Inventory Grid**
   - Single column on mobile
   - Condensed card variant

4. **Forms**
   - Full-width inputs
   - Larger touch targets
   - Bottom sheet dialogs

---

## 5. Accessibility Requirements

### Current Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Keyboard Navigation | 🟡 | Tab order works, some gaps |
| Screen Reader | 🟡 | Some missing ARIA |
| Focus Indicators | ✅ | Default styles work |
| Color Contrast | ✅ | Tailwind defaults good |
| Touch Targets | 🟡 | Some buttons too small |
| Alt Text | 🟡 | Missing on some images |

### Required Improvements

#### ARIA Labels

```tsx
// Add to interactive elements
<Button aria-label="Add new inventory item">
  <Plus className="h-4 w-4" />
</Button>

// Add to status indicators
<Badge aria-label="Low stock status">
  Low Stock
</Badge>

// Add to navigation
<nav aria-label="Main navigation">
  <Sidebar />
</nav>
```

#### Skip Links

```tsx
// Add to layout.tsx
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-background focus:z-50"
>
  Skip to main content
</a>

<main id="main-content">
  {children}
</main>
```

#### Focus Management

```tsx
// On dialog open, focus first interactive element
const dialogRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (open) {
    const firstFocusable = dialogRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    firstFocusable?.focus();
  }
}, [open]);
```

---

## 6. User Flow Diagrams

### 6.1 Add Inventory Item Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Click "+"   │────▶│  Fill Form   │────▶│   Validate   │
│   Button     │     │   Fields     │     │    Input     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                           ┌─────────────────────┼─────────────────────┐
                           │                     │                     │
                           ▼                     ▼                     ▼
                    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
                    │    Valid     │      │   Invalid    │      │   Cancel     │
                    │   Submit     │      │ Show Errors  │      │   Close      │
                    └──────────────┘      └──────────────┘      └──────────────┘
                           │                     │
                           ▼                     │
                    ┌──────────────┐             │
                    │  Save Item   │◀────────────┘
                    │  to Service  │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Show Success │
                    │    Toast     │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Close Modal  │
                    │ Refresh List │
                    └──────────────┘
```

### 6.2 Machine Status Update Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Select Status│────▶│  Confirm if  │────▶│   Update     │
│  Dropdown    │     │  Critical    │     │   Service    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                     ┌───────────────────────────┤
                     ▼                           ▼
              ┌──────────────┐            ┌──────────────┐
              │   Success    │            │    Error     │
              │   Update UI  │            │  Show Toast  │
              └──────────────┘            └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Log Audit   │
              │    Entry     │
              └──────────────┘
```

---

## 7. Animation & Transition Guidelines

### Recommended Animations

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Fade In | 150ms | ease-out | Dialogs, tooltips |
| Slide In | 200ms | ease-out | Sidebars, sheets |
| Scale | 150ms | ease-out | Cards, buttons |
| Skeleton Pulse | 2s | ease-in-out | Loading states |

### Tailwind Animation Classes

```css
/* Add to globals.css */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}

.animate-slide-in-right {
  animation: slide-in-right 200ms ease-out;
}

.animate-scale-in {
  animation: scale-in 150ms ease-out;
}
```

### Usage Examples

```tsx
// Card hover effect
<Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">

// Status pulse for online machines
<div className="relative">
  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
  <div className="relative h-3 w-3 bg-green-500 rounded-full" />
</div>

// Page transition
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

---

## 8. Style Guide Completion

### Color Usage

| Color | Usage | Tailwind Class |
|-------|-------|----------------|
| Primary | Actions, links | `text-primary`, `bg-primary` |
| Secondary | Secondary actions | `text-secondary`, `bg-secondary` |
| Destructive | Delete, errors | `text-destructive`, `bg-destructive` |
| Muted | Subtle text | `text-muted-foreground` |
| Success | Confirmations | `text-green-600` |
| Warning | Warnings | `text-yellow-600` |

### Status Colors (Consistent Usage)

| Status | Background | Text | Border |
|--------|------------|------|--------|
| Online/Active | `bg-green-100` | `text-green-800` | `border-green-200` |
| Offline | `bg-gray-100` | `text-gray-800` | `border-gray-200` |
| Error | `bg-red-100` | `text-red-800` | `border-red-200` |
| Maintenance | `bg-yellow-100` | `text-yellow-800` | `border-yellow-200` |
| Low Stock | `bg-orange-100` | `text-orange-800` | `border-orange-200` |
| Good Stock | `bg-blue-100` | `text-blue-800` | `border-blue-200` |

---

## 9. Implementation Priority

### Phase 1 (Week 1-2)

| Task | Effort | Impact |
|------|--------|--------|
| Add Breadcrumb component | 4h | High |
| Add EmptyState component | 4h | High |
| Add LoadingSkeleton component | 6h | High |
| Add 404/Error pages | 4h | Medium |

### Phase 2 (Week 3-4)

| Task | Effort | Impact |
|------|--------|--------|
| Implement Monitoring page | 40h | Critical |
| Enhance Team page | 16h | High |
| Mobile optimize Analytics | 8h | Medium |

### Phase 3 (Week 5-6)

| Task | Effort | Impact |
|------|--------|--------|
| Accessibility improvements | 16h | High |
| Animation polish | 8h | Medium |
| Stock Check enhancements | 16h | Medium |

---

## 10. Design Tokens (Future)

For design system maturity, consider extracting to CSS variables:

```css
:root {
  /* Colors */
  --color-primary: 220.9 39.3% 11%;
  --color-secondary: 220 14.3% 95.9%;
  --color-success: 142.1 76.2% 36.3%;
  --color-warning: 37.7 92.1% 50.2%;
  --color-error: 0 84.2% 60.2%;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  
  /* Borders */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-normal: 200ms;
  --transition-slow: 300ms;
}
```
