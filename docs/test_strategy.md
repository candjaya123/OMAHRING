# OMAHRING — Test Strategy

> **Who should read this:** All engineers, QA, AI assistants.  
> **Why it matters:** Large systems without test coverage become fragile. Every untested feature is a liability that slows down future development and creates unpredictable regressions.

---

## 1. Current Testing State

| Layer | Current State | Risk |
|---|---|---|
| **Backend Unit Tests** | ❌ None | Cannot safely refactor |
| **Backend Integration Tests** | ❌ None | API regressions go undetected |
| **Frontend Component Tests** | ❌ None | UI regressions undetected |
| **Frontend E2E Tests** | ❌ None | Critical checkout flow untested |
| **Manual Tests** | ⚠️ Ad-hoc `test_*.js` scripts in server root | Not automated, not reliable |

### Existing Ad-Hoc Test Files (Non-Standard)

```
server/test_chat.js
server/test_db.js
server/test_get_sessions.js
server/test_http_reply.js
server/test_http_send.js
server/test_insert.js
server/test_rpc.js
server/test_send.js
server/test_start_session.js
server/test_update.js
```

These are manual scripts, NOT automated tests. They should be either:
1. Converted to proper Jest integration tests and moved to `tests/`
2. Deleted if no longer needed

---

## 2. Testing Architecture

### Test Stack

| Layer | Framework | Library |
|---|---|---|
| **Backend unit tests** | Jest | `jest`, `@jest/globals` |
| **Backend integration tests** | Jest + Supertest | `supertest` |
| **Frontend component tests** | Vitest + RTL | `vitest`, `@testing-library/react`, `@testing-library/user-event` |
| **E2E tests** | Playwright | `@playwright/test` |
| **API mocking** | MSW | `msw` (for frontend tests) |
| **DB test isolation** | Jest setup hooks | Truncate test tables or use transactions |

---

## 3. Folder Structure

```
server/
└── tests/
    ├── unit/
    │   ├── auth.service.test.js
    │   ├── orders.service.test.js
    │   ├── cart.service.test.js
    │   └── products.service.test.js
    ├── integration/
    │   ├── auth.routes.test.js
    │   ├── orders.routes.test.js
    │   ├── cart.routes.test.js
    │   └── products.routes.test.js
    └── fixtures/
        ├── users.fixture.js
        ├── products.fixture.js
        └── orders.fixture.js

client/
└── src/
    └── __tests__/
        ├── components/
        │   ├── ProductCard.test.jsx
        │   ├── CartItem.test.jsx
        │   └── OrderStatusBadge.test.jsx
        └── features/
            ├── auth/useAuth.test.js
            └── cart/cartSlice.test.js

e2e/
├── checkout.spec.js
├── auth.spec.js
├── admin-products.spec.js
└── playwright.config.js
```

---

## 4. Unit Testing

### What to Unit Test (Backend)

Unit tests target **service layer functions** — pure business logic with mocked dependencies.

```js
// tests/unit/orders.service.test.js

const { describe, it, expect, jest, beforeEach } = require('@jest/globals');

// Mock the repository
jest.mock('../../modules/orders/orders.repository');
jest.mock('../../modules/products/products.repository');
jest.mock('../../shared/midtrans.service');
jest.mock('../../modules/settings/settings.repository');

const ordersService = require('../../modules/orders/orders.service');
const ordersRepository = require('../../modules/orders/orders.repository');
const settingsRepository = require('../../modules/settings/settings.repository');

describe('ordersService.createOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    settingsRepository.getStoreSettings.mockResolvedValue({
      store_service_fee: 2000,
      midtrans_server_key: 'test-key',
      midtrans_is_production: false,
    });
  });

  it('should throw ConflictError if cartId already has pending order', async () => {
    ordersRepository.findPendingByCartId.mockResolvedValue({ id: 'existing-order-id' });
    
    await expect(ordersService.createOrder({ cartId: 'cart-123', /* ... */ }))
      .rejects.toThrow('Checkout already in progress');
  });

  it('should calculate correct total with bank_transfer fee', async () => {
    ordersRepository.findPendingByCartId.mockResolvedValue(null);
    // ... set up mocks for products, etc.
    
    const result = await ordersService.calculateTotal({
      productTotal: 1000000,
      shippingCost: 50000,
      storeServiceFee: 2000,
      paymentCategory: 'bank_transfer',
    });
    
    // productTotal + shipping + storeFee + bankFee(4000)
    expect(result.expectedTotal).toBe(1056000);
    expect(result.paymentServiceFee).toBe(4000);
  });
});
```

### What to Unit Test (Frontend)

Unit tests target **Redux slices and utility functions**.

```js
// src/__tests__/features/cart/cartSlice.test.js

import cartReducer, { addItem, removeItem, clearCart } from '@/features/shop/cart/store/cartSlice';

describe('cartSlice', () => {
  const initialState = { items: [], cartTotal: 0, isLoading: false, error: null };

  it('should handle initial state', () => {
    expect(cartReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle clearCart', () => {
    const state = { ...initialState, items: [{ id: '1', quantity: 2 }] };
    expect(cartReducer(state, clearCart())).toEqual(initialState);
  });
});
```

---

## 5. Integration Testing

Integration tests validate the full HTTP request→response cycle against a real (test) database.

```js
// tests/integration/auth.routes.test.js

const request = require('supertest');
const app = require('../../server'); // Express app (exported separately from listen)

describe('POST /api/auth/login', () => {
  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' }); // Missing password
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notfound@example.com', password: 'wrongpass' });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 and JWT cookie for valid credentials', async () => {
    // Requires a seeded test user in DB
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@omahring.com', password: 'testpassword123' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
```

### Test Database Strategy

```js
// tests/setup.js
beforeAll(async () => {
  // Seed test data
  await seedTestUsers();
  await seedTestProducts();
});

afterEach(async () => {
  // Clean up orders created during tests
  await cleanupOrders();
});

afterAll(async () => {
  // Full cleanup
  await cleanupAll();
});
```

---

## 6. Frontend Component Testing

```jsx
// src/__tests__/components/ProductCard.test.jsx

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTestStore } from '../utils/testStore';
import ProductCard from '@/features/shop/catalog/components/ProductCard';

const mockProduct = {
  id: 'prod-1',
  title: 'Murai Batu Kalimantan',
  variants: [{ name: 'Anakan Jantan', price: 1500000, salePrice: 0, totalStock: 5 }],
  media: { images: ['https://example.com/img.jpg'] },
};

describe('ProductCard', () => {
  it('renders product title', () => {
    render(
      <Provider store={createTestStore()}>
        <ProductCard product={mockProduct} />
      </Provider>
    );
    expect(screen.getByText('Murai Batu Kalimantan')).toBeInTheDocument();
  });

  it('shows out of stock when totalStock is 0', () => {
    const outOfStockProduct = {
      ...mockProduct,
      variants: [{ ...mockProduct.variants[0], totalStock: 0 }],
    };
    render(<Provider store={createTestStore()}><ProductCard product={outOfStockProduct} /></Provider>);
    expect(screen.getByText(/stok habis/i)).toBeInTheDocument();
  });
});
```

---

## 7. E2E Testing

### Critical Paths (Must Test)

| Priority | Flow | Why |
|---|---|---|
| 🔴 Critical | Guest checkout → Payment → Order created | Revenue flow |
| 🔴 Critical | User registration → Login → Add to cart → Checkout | Core conversion |
| 🔴 Critical | Admin: Create product → visible in shop | Inventory management |
| 🟡 High | Membership upgrade flow | Revenue flow |
| 🟡 High | Order status update by admin | Operations |
| 🟢 Medium | Chat initiation (guest → admin) | Support flow |
| 🟢 Medium | Bird profile creation by member | Community feature |

```js
// e2e/checkout.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Guest Checkout Flow', () => {
  test('guest can add product to cart and initiate checkout', async ({ page }) => {
    await page.goto('/shop/home');
    
    // Navigate to a product
    await page.click('[data-testid="product-card"]:first-child');
    await expect(page).toHaveURL(/\/shop\/product\//);
    
    // Select variant and add to cart
    await page.click('[data-testid="variant-selector"]:first-child');
    await page.click('[data-testid="add-to-cart-btn"]');
    
    // Verify cart badge updated
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    
    // Proceed to checkout
    await page.goto('/shop/checkout');
    await expect(page.locator('[data-testid="cart-summary"]')).toBeVisible();
  });
});
```

---

## 8. Regression Testing

### Before Each Release

- [ ] Run full unit test suite (`npm test`)
- [ ] Run integration test suite
- [ ] Run E2E critical path tests
- [ ] Manual smoke test: login, browse product, add to cart, view checkout

### Automated Regression via CI

Every PR to `main` branch triggers:
1. `npm run lint` (frontend + backend)
2. `npm test` (backend unit tests)
3. `npm run test:integration` (backend integration tests)
4. `npm run test:e2e` (E2E tests against staging)

---

## 9. Load Testing

### When to Run
- Before any promo campaign launch
- Before platform announcement / viral marketing
- When adding new payment methods

### Tool: k6

```js
// load-tests/checkout.k6.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50,          // 50 concurrent users
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],      // Less than 1% failure rate
  },
};

export default function () {
  const res = http.get('https://omahring.com/api/shop/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Load Test Targets

| Endpoint | Target Concurrent Users | Acceptable P95 |
|---|---|---|
| Product list | 200 | < 500ms |
| Product detail | 200 | < 300ms |
| Cart fetch | 100 | < 500ms |
| Checkout | 50 | < 3000ms |
| Admin dashboard | 20 | < 1000ms |

---

## 10. QA Workflow

### Feature Development Checklist

Before any PR is merged:
- [ ] Unit tests written for new service functions
- [ ] Integration test written for new API endpoint
- [ ] No existing tests broken
- [ ] Manual test of happy path and 2+ edge cases
- [ ] `npm run lint` passes

### Bug Fix Checklist
- [ ] Reproduce bug with a failing test
- [ ] Fix the code
- [ ] Verify test passes
- [ ] Verify no regression in related tests

---

*Last updated: 2026-05-11 | Generated by architecture audit*
