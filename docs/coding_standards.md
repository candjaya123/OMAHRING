# OMAHRING — Coding Standards

> **Who should read this:** All engineers and AI coding assistants working on this project.  
> **Why it matters:** Consistent code enables safe collaboration across humans and AI. Without standards, every contributor introduces diverging patterns that compound into unmaintainable chaos.

---

## 1. Language Standards

| Layer | Language |
|---|---|
| Frontend | JavaScript (JSX) — TypeScript migration planned |
| Backend | JavaScript (CommonJS) — TypeScript migration planned |
| Database | SQL (PostgreSQL dialect) |
| Config | JSON, `.env` |

---

## 2. Naming Conventions

### Files

| Layer | Convention | Example |
|---|---|---|
| React components | `kebab-case.jsx` | `product-card.jsx`, `checkout-form.jsx` |
| React pages | `kebab-case.jsx` | `product-detail.jsx`, `admin-dashboard.jsx` |
| Redux slices | `kebab-case-slice/index.js` | `cart-slice/index.js` |
| Backend controllers | `kebab-case-controller.js` | `order-controller.js` |
| Backend routes | `kebab-case-routes.js` | `order-routes.js` |
| Backend services (ideal) | `kebab-case-service.js` | `order-service.js` |
| Backend repositories (ideal) | `kebab-case-repository.js` | `order-repository.js` |
| Middleware | `kebab-case.middleware.js` | `auth.middleware.js` |
| Helpers / utilities | `kebab-case.js` | `store-settings-helper.js` |

### Variables and Functions

| Type | Convention | Example |
|---|---|---|
| Variables | `camelCase` | `cartItems`, `userId`, `totalAmount` |
| Functions | `camelCase` | `createOrder()`, `fetchCartItems()` |
| Constants | `UPPER_SNAKE_CASE` | `JWT_SECRET`, `MAX_UPLOAD_SIZE` |
| React components | `PascalCase` | `ProductCard`, `CheckoutForm` |
| Redux slices | `camelCase name` | `cartSlice`, `authSlice` |
| CSS classes | Tailwind utilities (no custom class names unless using `@layer components`) |

### Database

| Object | Convention | Example |
|---|---|---|
| Tables | `snake_case` plural | `orders`, `cart_items`, `product_variants` |
| Columns | `snake_case` | `user_id`, `order_status`, `created_at` |
| Primary keys | always `id` | `id UUID` |
| Foreign keys | `{referenced_table_singular}_id` | `order_id`, `product_id` |
| Indexes | `idx_{table}_{column(s)}` | `idx_orders_user_id` |

> **Current violation:** The existing schema uses mixed `camelCase` (`userName`, `cartId`, `orderStatus`) and `snake_case` (`user_id`, `created_at`). All new columns MUST use `snake_case`. Legacy columns should be migrated in a planned schema refactor.

---

## 3. Folder Structure Rules

### Backend

```
server/modules/{domain}/
├── {domain}.routes.js       ← Route definitions only
├── {domain}.controller.js   ← HTTP in/out only
├── {domain}.service.js      ← Business logic
├── {domain}.repository.js   ← DB queries
└── {domain}.schema.js       ← Zod validation schemas
```

**Rules:**
- Controllers must NOT contain business logic
- Services must NOT import from `express` or deal with `req/res`
- Repositories must NOT contain business logic
- No circular dependencies between modules

### Frontend

```
client/src/features/{domain}/
├── components/   ← Domain-specific UI components
├── pages/        ← Page-level components (mounted by router)
├── store/        ← Redux slice + actions + selectors
└── hooks/        ← Domain-specific custom hooks
```

---

## 4. Formatting Rules

- **Indentation:** 2 spaces (no tabs)
- **Line endings:** LF (Unix-style)
- **Max line length:** 120 characters
- **Semicolons:** Required in backend (CommonJS), optional in frontend (prefer no semicolons with Prettier)
- **Quotes:** Single quotes in backend, double quotes in JSX attributes
- **Trailing commas:** Always in multi-line objects/arrays
- **Arrow functions:** Preferred for callbacks and component definitions

```js
// ✅ Good
const createOrder = async (req, res) => {
  const { userId, cartItems } = req.body;
};

// ❌ Bad — inconsistent style
function createOrder(req, res) { 
    var userId = req.body.userId
}
```

---

## 5. Logging Strategy

### Levels

| Level | When to Use |
|---|---|
| `console.error` | Caught exceptions, critical failures |
| `console.warn` | Degraded behavior that doesn't break the app |
| `console.log` | Development debugging only — REMOVE before production |
| (Ideal) `logger.info` | Structured logs in production (Pino/Winston) |

### Rules
- Log the **context** (function name, relevant IDs), not raw objects
- Never log sensitive data (passwords, tokens, card numbers)
- Every `catch` block MUST log the error with context

```js
// ✅ Good
try {
  // ...
} catch (error) {
  console.error('[createOrder] Failed to insert order:', error.message, { userId, cartId });
  res.status(500).json({ success: false, message: 'Order creation failed.' });
}

// ❌ Bad
} catch (e) {
  console.log(e);
  res.status(500).json({ success: false, message: 'Some error occured' });
}
```

### Required: Prefix all logs with context tag

```js
console.error('[AuthController.login] Invalid credentials for:', email);
console.error('[OrderService.createOrder] Midtrans error:', error.message);
```

---

## 6. Error Handling Rules

### Backend

1. All controllers MUST be wrapped in `try/catch`
2. All caught errors MUST be logged with context
3. All error responses MUST use correct HTTP status codes
4. All error responses MUST use the standard envelope:

```js
// Standard error response
res.status(statusCode).json({
  success: false,
  message: 'Human-readable description',
});

// NEVER:
res.json({ success: false, message: '...' }); // Missing status code
res.status(500).send('Error');                // Non-JSON response
```

5. Business rule violations → `422 Unprocessable Entity`
6. Validation failures → `400 Bad Request`
7. Auth failures → `401 Unauthorized`
8. Permission failures → `403 Forbidden`
9. Not found → `404 Not Found`

### Frontend

1. All async thunks in Redux MUST handle `rejected` state
2. All API errors MUST be surfaced to the user via toast or inline error
3. Never swallow errors silently

```js
// ✅ Good
builder.addCase(createOrder.rejected, (state, action) => {
  state.isLoading = false;
  state.error = action.payload?.message || 'Order creation failed.';
});

// ❌ Bad
builder.addCase(createOrder.rejected, (state) => {
  state.isLoading = false;
  // Error silently ignored
});
```

---

## 7. Testing Expectations

| Test Type | Tool | Target |
|---|---|---|
| Backend unit tests | Jest | Services, business logic functions |
| Backend integration tests | Jest + Supertest | API endpoints |
| Frontend component tests | Vitest + React Testing Library | UI components |
| Frontend E2E | Playwright | Critical user flows |

### Minimum Coverage Targets (Future)

| Module | Unit | Integration |
|---|---|---|
| Auth service | 90% | 80% |
| Order service | 90% | 80% |
| Cart service | 85% | 75% |
| Products service | 80% | 70% |

---

## 8. Code Duplication Rules

- Never copy-paste business logic between controllers — extract to service
- Never duplicate DB queries — use repository functions
- Never repeat validation logic — use shared Zod schemas
- Use React custom hooks to encapsulate repeated `useDispatch` + `useSelector` patterns

---

## 9. Comment Policy

- Comments explain **WHY**, not **WHAT** (the code explains what)
- All complex business logic MUST have a comment explaining the rule
- TODOs must include a ticket reference or date: `// TODO(2026-06-01): Implement promo server-side validation`
- NEVER commit `console.log` debugging lines to main branch

```js
// ✅ Good comment — explains the WHY
// Prevent duplicate checkout: if same cartId has pending/unpaid order,
// customer may have already started payment in another tab.
const { data: existing } = await supabase
  .from('orders')
  .eq('cart_id', cartId)
  .in('payment_status', ['unpaid', 'pending']);

// ❌ Bad comment — just restates the code
// Find existing order
const { data: existing } = ...
```

---

## 10. Dependency Rules

- No new npm package should be added without team discussion
- No frontend package that duplicates existing capability (e.g., don't add `moment.js` if `date-fns` is already used)
- No backend package that pulls in hundreds of transitive dependencies for simple utilities
- All dependencies must be pinned to major.minor version (e.g., `"^4.19.2"`, not `"*"`)

---

## 11. Environment Variable Rules

- All env vars MUST be documented in a `.env.example` file
- Never commit actual `.env` files (`.gitignore` enforced)
- Backend validates required env vars on startup
- Frontend env vars MUST be prefixed with `VITE_`
- No hardcoded secrets in source code — not even in comments

```js
// ✅ Good
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET is required');

// ❌ Bad
const token = jwt.sign(payload, 'CLIENT_SECRET_KEY'); // Hardcoded secret
```

---

## 12. Anti-Pattern Blacklist

These patterns are FORBIDDEN in this codebase:

| Anti-Pattern | Reason |
|---|---|
| `console.log(e)` in production | No context, not structured |
| `res.json({ success: false })` without status code | HTTP contract violation |
| Business logic in route handlers | Violates layered architecture |
| Direct Supabase calls in controllers (once service layer exists) | Violates repository pattern |
| Storing secrets in source code | Critical security risk |
| JSONB for data that should be relational | Prevents efficient querying |
| `_id` field in API responses | MongoDB legacy, PostgreSQL uses `id` |
| Empty `catch` blocks | Silent failures are undebuggable |

---

*Last updated: 2026-05-11 | Generated by architecture audit*
