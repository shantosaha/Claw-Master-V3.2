# Testing Strategy Master Plan - Claw Master V3

## Document Information
- **Project**: Claw Master V3 - Arcade Inventory & Settings Tracker
- **Created**: December 9, 2024
- **Version**: 1.0.0

---

## 1. Overview

### Current State
- **Test Coverage**: 0%
- **Test Framework**: Not configured
- **E2E Tests**: None
- **CI/CD Testing**: None

### Target State
- **Test Coverage**: 80%+
- **Test Framework**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **CI/CD Testing**: GitHub Actions

---

## 2. Testing Pyramid

```
                    /\
                   /  \
                  / E2E \         5-10 tests
                 /  Tests \
                /──────────\
               /            \
              / Integration  \    50-100 tests
             /    Tests       \
            /──────────────────\
           /                    \
          /     Unit Tests       \   200+ tests
         /──────────────────────────\
```

| Test Type | Purpose | Count Target | Coverage Target |
|-----------|---------|--------------|-----------------|
| Unit | Test individual functions/components | 200+ | 80% |
| Integration | Test component interactions | 50-100 | Key flows |
| E2E | Test complete user journeys | 5-10 | Critical paths |

---

## 3. Technology Stack

### Unit & Integration Testing

| Tool | Purpose | Version |
|------|---------|---------|
| Jest | Test runner | ^29 |
| @testing-library/react | Component testing | ^14 |
| @testing-library/jest-dom | DOM matchers | ^6 |
| @testing-library/user-event | User interaction simulation | ^14 |
| jest-environment-jsdom | Browser environment | ^29 |

### E2E Testing

| Tool | Purpose | Version |
|------|---------|---------|
| Playwright | Browser automation | ^1.40 |
| @playwright/test | Test framework | ^1.40 |

### Utilities

| Tool | Purpose |
|------|---------|
| msw | API mocking |
| faker-js | Test data generation |

---

## 4. Setup Instructions

### 4.1 Install Dependencies

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest ts-jest

npm install --save-dev @playwright/test
npx playwright install
```

### 4.2 Jest Configuration

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
};

export default createJestConfig(config);
```

### 4.3 Jest Setup File

Create `jest.setup.ts`:

```typescript
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
}));

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  isFirebaseInitialized: false,
}));
```

### 4.4 Playwright Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.5 Update package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 5. Test Categories & Priorities

### 5.1 Unit Tests (Phase 1 Priority)

#### Services (Critical)

| Service | File | Test Focus |
|---------|------|------------|
| firestoreService | `firestoreService.test.ts` | CRUD operations, error handling |
| analyticsService | `analyticsService.test.ts` | Data aggregation, calculations |
| mockInventoryService | `mockInventoryService.test.ts` | State management, CRUD |
| mockMachineService | `mockMachineService.test.ts` | State management, CRUD |

#### Utilities (Critical)

| Utility | File | Test Focus |
|---------|------|------------|
| utils | `utils.test.ts` | cn function, formatters |
| image compression | `imageUtils.test.ts` | Compression logic |

#### Hooks (High)

| Hook | File | Test Focus |
|------|------|------------|
| use-toast | `use-toast.test.ts` | Toast state management |

### 5.2 Component Tests (Phase 2 Priority)

#### UI Components (High)

| Component | Test Focus |
|-----------|------------|
| Button | Variants, click handlers, disabled state |
| Input | Value changes, validation display |
| Dialog | Open/close state, content rendering |
| Select | Option selection, value changes |
| Badge | Variant rendering |
| Card | Content rendering |

#### Feature Components (Critical)

| Component | Test Focus |
|-----------|------------|
| StockItemCard | Data display, actions, click handlers |
| MachineCard | Data display, status colors |
| StockFilters | Filter changes, reset |
| ProtectedRoute | Access control, redirect |

#### Form Components (High)

| Component | Test Focus |
|-----------|------------|
| StockItemForm | Validation, submission, error display |
| AdjustStockDialog | Quantity adjustments |
| AddMachineDialog | Form submission |

### 5.3 Integration Tests (Phase 3 Priority)

| Test Suite | Scope |
|------------|-------|
| Inventory CRUD | Create, read, update, delete flow |
| Machine Management | Full machine lifecycle |
| Order Processing | Kanban drag and drop |
| Authentication | Login, logout, session |
| Analytics | Data loading, filtering |

### 5.4 E2E Tests (Phase 4 Priority)

| Test | User Journey |
|------|--------------|
| Login Flow | Google OAuth → Dashboard |
| Add Inventory | Navigate → Add → Verify |
| Edit Machine | Select → Edit → Save |
| Process Order | Create → Move through Kanban |
| View Analytics | Navigate → Filter → Verify |

---

## 6. Test File Examples

### 6.1 Unit Test Example

`src/lib/__tests__/utils.test.ts`:

```typescript
import { cn } from '../utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });
});
```

### 6.2 Component Test Example

`src/components/ui/__tests__/button.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
    
    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-input');
  });
});
```

### 6.3 Integration Test Example

`src/components/inventory/__tests__/StockList.integration.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockList } from '../StockList';
import { DataProvider } from '@/context/DataProvider';
import { AuthProvider } from '@/context/AuthContext';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <DataProvider>{children}</DataProvider>
  </AuthProvider>
);

describe('StockList Integration', () => {
  it('loads and displays stock items', async () => {
    render(
      <TestWrapper>
        <StockList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Items should be displayed
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
  });

  it('filters items by search', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <StockList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Pokemon');

    // Filtered results should appear
    await waitFor(() => {
      expect(screen.getAllByText(/pokemon/i).length).toBeGreaterThan(0);
    });
  });
});
```

### 6.4 E2E Test Example

`e2e/inventory.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    // Wait for demo mode auth
    await page.waitForSelector('[data-testid="dashboard"]');
  });

  test('navigate to inventory and view items', async ({ page }) => {
    await page.click('a[href="/inventory"]');
    await expect(page).toHaveURL('/inventory');
    await expect(page.locator('h1')).toContainText('Inventory');
    
    // Items should load
    await expect(page.locator('[data-testid="stock-item"]')).toHaveCount(10);
  });

  test('search for items', async ({ page }) => {
    await page.goto('/inventory');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Pokemon');
    
    // Should filter to matching items
    await expect(page.locator('[data-testid="stock-item"]'))
      .toContainText(['Pokemon']);
  });

  test('view item details', async ({ page }) => {
    await page.goto('/inventory');
    
    // Click first item
    await page.locator('[data-testid="stock-item"]').first().click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/inventory\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

---

## 7. Test Coverage Requirements

### Global Thresholds

| Metric | Minimum | Target |
|--------|---------|--------|
| Statements | 80% | 90% |
| Branches | 70% | 85% |
| Functions | 70% | 85% |
| Lines | 80% | 90% |

### Per-Directory Thresholds

| Directory | Statements | Branches |
|-----------|------------|----------|
| src/services | 90% | 85% |
| src/lib | 85% | 80% |
| src/components/ui | 80% | 70% |
| src/components/inventory | 80% | 75% |
| src/components/machines | 80% | 75% |

---

## 8. CI/CD Integration

### GitHub Actions Workflow

`.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 9. Test Data Strategy

### Mock Data Factory

`src/test/factories/stockItem.ts`:

```typescript
import { StockItem } from '@/types';

export const createMockStockItem = (overrides?: Partial<StockItem>): StockItem => ({
  id: `item-${Date.now()}`,
  sku: 'TEST-001',
  name: 'Test Item',
  category: 'Test Category',
  locations: [{ name: 'Test Location', quantity: 10 }],
  lowStockThreshold: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockStockItems = (count: number): StockItem[] =>
  Array.from({ length: count }, (_, i) =>
    createMockStockItem({ id: `item-${i}`, name: `Test Item ${i}` })
  );
```

### MSW Handlers

`src/test/mocks/handlers.ts`:

```typescript
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/stock', (req, res, ctx) => {
    return res(ctx.json(createMockStockItems(10)));
  }),
  
  rest.post('/api/stock', async (req, res, ctx) => {
    const item = await req.json();
    return res(ctx.json({ ...item, id: 'new-id' }));
  }),
];
```

---

## 10. Implementation Timeline

### Week 1-2: Foundation

- [ ] Install testing dependencies
- [ ] Configure Jest
- [ ] Configure Playwright
- [ ] Create test utilities
- [ ] Write 20 unit tests for critical paths

### Week 3-4: Core Tests

- [ ] Unit tests for all services (50+ tests)
- [ ] Unit tests for UI components (30+ tests)
- [ ] Integration tests for inventory (10 tests)
- [ ] Integration tests for machines (10 tests)

### Week 5-6: Comprehensive Coverage

- [ ] Unit tests for feature components (50+ tests)
- [ ] Integration tests for remaining features
- [ ] E2E tests for critical flows (5 tests)
- [ ] Set up CI/CD pipeline

### Week 7-8: Polish

- [ ] Reach 80% coverage
- [ ] Add visual regression tests (optional)
- [ ] Performance tests
- [ ] Documentation

---

## 11. Quality Gates

### Pre-Commit

- [ ] Lint passes
- [ ] Types check
- [ ] Unit tests pass

### Pre-Merge

- [ ] All tests pass
- [ ] Coverage thresholds met
- [ ] No new critical issues

### Pre-Deploy

- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Manual smoke test complete

---

## 12. Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Unit Test Count | 200+ | Week 8 |
| Integration Test Count | 50+ | Week 8 |
| E2E Test Count | 10+ | Week 8 |
| Statement Coverage | 80% | Week 8 |
| Branch Coverage | 70% | Week 8 |
| Test Run Time | < 2 min | Week 8 |
| CI Pipeline Time | < 10 min | Week 6 |
