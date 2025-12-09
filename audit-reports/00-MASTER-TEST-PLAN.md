# Claw Master V3 - Master Test Plan

## Document Information
- **Project**: Claw Master V3 - Arcade Inventory & Playfield-Settings Tracker
- **Audit Date**: December 9, 2024
- **Version**: 1.0.0

---

## 1. Executive Summary

This test plan provides comprehensive coverage for the Claw Master V3 web application, a Next.js 15-based arcade management system with Firebase backend integration. The application manages arcade machines, stock inventory, orders, maintenance tasks, analytics, and team management.

---

## 2. Feature Inventory

### 2.1 Pages & Routes

| Route | Page | File Location | Dependencies |
|-------|------|---------------|--------------|
| `/` | Dashboard | `src/app/page.tsx` | DataProvider, machineService, maintenanceService, orderService |
| `/inventory` | Inventory List | `src/app/inventory/page.tsx` | StockList component |
| `/inventory/[id]` | Stock Item Detail | `src/app/inventory/[id]/page.tsx` | StockDetailHero, stockService |
| `/machines` | Machine Management | `src/app/machines/page.tsx` | machineService, apiService |
| `/machines/[id]` | Machine Detail | `src/app/machines/[id]/page.tsx` | MachineCard, SlotsList |
| `/orders` | Order Board | `src/app/orders/page.tsx` | OrderBoard (Kanban) |
| `/orders/history` | Order History | `src/app/orders/history/page.tsx` | Order history display |
| `/maintenance` | Maintenance Dashboard | `src/app/maintenance/page.tsx` | MaintenanceDashboard |
| `/analytics` | Analytics Dashboard | `src/app/analytics/page.tsx` | analyticsService, Recharts |
| `/stock-check` | Weekly Stock Check | `src/app/stock-check/page.tsx` | StockCheckForm |
| `/team` | Team Management | `src/app/team/page.tsx` | Firebase users collection |
| `/settings` | Application Settings | `src/app/settings/page.tsx` | Multiple tabs/preferences |
| `/settings/history` | Settings History | `src/app/settings/history/page.tsx` | Playfield settings history |
| `/monitoring` | Real-time Monitoring | `src/app/monitoring/page.tsx` | Placeholder (Coming Soon) |
| `/account` | User Account | `src/app/account/page.tsx` | AuthContext |

### 2.2 Core Components

| Component Category | Component Count | Key Components |
|-------------------|-----------------|----------------|
| UI Components | 31 | Button, Card, Dialog, Select, Input, Tabs, etc. |
| Inventory | 12 | StockList, StockItemCard, StockItemForm, AdjustStockDialog |
| Machines | 10 | MachineCard, MachineTable, AddMachineDialog, SlotsList |
| Analytics | 12 | RevenueChart, MachinePerformanceChart, AdvancedFilters |
| Maintenance | 4 | MaintenanceDashboard, KanbanColumn, MaintenanceDialog |
| Orders | 2 | OrderBoard, OrderDialog |
| Layout | 3 | AppShell, Sidebar, Header |
| Auth | 1 | ProtectedRoute |

### 2.3 Services Layer

| Service | File | Purpose |
|---------|------|---------|
| stockService | `src/services/index.ts` | Stock item CRUD operations |
| machineService | `src/services/index.ts` | Machine CRUD and sync |
| orderService | `src/services/index.ts` | Reorder request management |
| maintenanceService | `src/services/index.ts` | Maintenance task tracking |
| analyticsService | `src/services/analyticsService.ts` | Analytics data aggregation |
| apiService | `src/services/apiService.ts` | External API integration |
| auditLogger | `src/services/auditLogger.ts` | Audit trail logging |

---

## 3. Test Categories

### 3.1 UI/UX Testing
- Component rendering verification
- Visual consistency across pages
- Theme switching (light/dark mode)
- Loading states and skeletons
- Error state displays
- Toast notifications

### 3.2 Responsiveness Testing
- Desktop (1200px+)
- Tablet (768px-1199px)
- Mobile (320px-767px)
- Sidebar collapse behavior
- Grid layout adaptations

### 3.3 Accessibility Testing (WCAG 2.1)
- Screen reader compatibility
- Keyboard navigation
- Focus management
- Color contrast ratios
- Alt text for images
- Form label associations

### 3.4 Input & Forms Testing
- Text field validation
- Number input handling
- Required field enforcement
- Form submission flows
- Error message display
- Input sanitization

### 3.5 Button & Interactive Elements
- Click handlers
- Disabled states
- Loading indicators
- Confirmation dialogs
- Dropdown menus

### 3.6 Navigation & Routing
- Link navigation
- Active state highlighting
- Dynamic route handling
- Back navigation
- Protected route access

### 3.7 State Management Testing
- React Context data flow
- Local storage persistence
- Real-time subscription updates
- Optimistic UI updates

### 3.8 API/Data Sync Testing
- Firebase Firestore operations
- Demo mode fallback
- Error handling
- Data transformation

### 3.9 Authentication Testing
- Google Sign-In flow
- Session persistence
- Role-based access control
- Demo mode authentication

### 3.10 Authorization Testing
- Admin-only features
- Manager permissions
- Staff access levels
- Protected route enforcement

### 3.11 Business Logic Testing
- Stock threshold calculations
- Machine status transitions
- Order workflow states
- Analytics aggregations

### 3.12 File Upload Testing
- Image upload handling
- File type validation
- Compression processing
- Storage integration

### 3.13 Performance Testing
- Initial page load time
- Chart rendering speed
- List virtualization
- Memory usage patterns

### 3.14 Security Testing
- XSS prevention
- CSRF protection
- Input sanitization
- Authentication tokens

---

## 4. Test Data Library

### 4.1 Valid Input Samples
```javascript
// Stock Item
{
  name: "Giant Teddy Bear",
  category: "Plush",
  sku: "PLUSH-001",
  lowStockThreshold: 10,
  locations: [{ name: "Zone A", quantity: 25 }]
}

// Machine
{
  name: "Claw Master 3000",
  assetTag: "AST-101",
  location: "Zone A",
  status: "Online",
  physicalConfig: "multi_4_slot"
}
```

### 4.2 Invalid Input Samples
```javascript
// Empty required fields
{ name: "", category: "" }

// Negative quantities
{ quantity: -5 }

// Invalid status values
{ status: "UNKNOWN" }
```

### 4.3 Edge Case Data
```javascript
// Maximum length strings
{ name: "A".repeat(500) }

// Unicode characters
{ name: "日本語テスト 🎮🎯" }

// Special characters
{ name: "<script>alert('xss')</script>" }

// Extreme numbers
{ quantity: 999999999 }
```

### 4.4 SQL/XSS Injection Strings
```javascript
"'; DROP TABLE users;--"
"<script>alert('xss')</script>"
"<img src=x onerror=alert('xss')>"
"javascript:alert('xss')"
```

---

## 5. Test Execution Matrix

| Test Type | Manual | Automated | Priority |
|-----------|--------|-----------|----------|
| Smoke Tests | ✓ | Future | Critical |
| Functional Tests | ✓ | Future | High |
| Integration Tests | ✓ | Future | High |
| Regression Tests | ✓ | Future | Medium |
| Visual Tests | ✓ | Future | Medium |
| Performance Tests | ✓ | Future | Medium |
| Security Tests | ✓ | Future | High |
| Accessibility Tests | ✓ | Future | Medium |

---

## 6. Environment Configuration

### 6.1 Development Environment
- **Framework**: Next.js 16.0.4 (Turbopack)
- **Node.js**: 18+
- **Package Manager**: npm
- **Port**: 3001 (configurable)

### 6.2 Browser Matrix
| Browser | Versions | Priority |
|---------|----------|----------|
| Chrome | Latest, Latest-1 | High |
| Firefox | Latest, Latest-1 | High |
| Safari | Latest, Latest-1 | Medium |
| Edge | Latest | Medium |

### 6.3 Device Matrix
| Device Type | Screen Sizes | Priority |
|-------------|--------------|----------|
| Desktop | 1920x1080, 1440x900 | High |
| Tablet | 1024x768, 768x1024 | High |
| Mobile | 375x812, 414x896 | Medium |

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Firebase connection failures | Medium | High | Demo mode fallback implemented |
| Data loss on browser crash | Low | Medium | Local storage backup |
| XSS vulnerabilities | Low | High | No dangerouslySetInnerHTML usage |
| Performance degradation | Medium | Medium | Code splitting, lazy loading |

---

## 8. Deliverables

- 30 category-specific audit reports
- Master summary report
- Screenshot documentation
- Browser session recordings
- Issue tracking with priority levels
