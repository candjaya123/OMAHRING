# OMAHRING — AI-Assisted Development Rules

> **Who should read this:** Any AI coding assistant (Antigravity, Gemini, Copilot, etc.) contributing to this project.  
> **Why it matters:** Without strict rules, AI-generated code introduces inconsistency, anti-patterns, and architectural violations that compound into unmaintainable systems. These rules ensure AI assistance remains a force multiplier, not a liability.

---

## 1. MANDATORY: Read Before Writing Any Code

Before generating any code for this project, the AI assistant MUST:

1. **Read `docs/overview.md`** — understand the project domain (ornamental bird e-commerce)
2. **Read `docs/architecture.md`** — understand the layered architecture and module boundaries
3. **Read `docs/coding_standards.md`** — naming conventions, error handling, logging
4. **Read `docs/api_contract.md`** — API response format and status codes
5. **Understand the domain context** — this is a real-money e-commerce system serving Indonesian users

---

## 2. Mandatory Architecture Rules

### Layer Boundaries — NEVER Violate These

| Rule | Detail |
|---|---|
| **Controllers contain HTTP only** | Parse `req.body`, call service, return `res.json()`. NO DB calls, NO business logic. |
| **Services contain business logic** | Orchestration, calculations, validations. NO `req`, NO `res`, NO direct Supabase calls. |
| **Repositories contain DB queries** | Supabase calls only. NO business logic, NO calculations. |
| **Routes contain routing only** | Method + path + middleware + controller. NO logic. |
| **No cross-module repository imports** | Module A MUST NOT import Module B's repository directly. |

```js
// ✅ CORRECT structure
// routes/orders.routes.js
router.post('/create', authenticate, validateBody(createOrderSchema), ordersController.createOrder);

// controllers/orders.controller.js
const createOrder = async (req, res) => {
  try {
    const result = await ordersService.createOrder(req.validatedBody);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error); // Use global error handler
  }
};

// services/orders.service.js
const createOrder = async (orderData) => {
  // Business logic here — no req/res
  const existing = await ordersRepository.findPendingByCartId(orderData.cartId);
  if (existing) throw new ConflictError('Duplicate checkout');
  // ...
};
```

---

## 3. Forbidden Patterns

**NEVER generate code that:**

| Forbidden | Reason |
|---|---|
| `res.json({ success: false })` without HTTP status code | HTTP contract violation |
| `console.log(e)` in catch block without context | Unhelpful in production |
| Business logic inside a route handler | Violates layered architecture |
| Direct Supabase calls inside controllers | Violates repository pattern |
| `{ ...row, _id: row.id }` field mapping | MongoDB legacy — use `id` only |
| Hardcoded secrets or API keys | Critical security violation |
| `update(req.body)` without field whitelisting | Mass assignment vulnerability |
| `select('*')` in production queries without reason | Returns unnecessary data |
| Business logic inside JSX components | Violates separation of concerns |
| Redux slice accessing localStorage directly | State should be normalized |
| Duplicating existing utility functions | Create once, import everywhere |

---

## 4. Required Response Patterns

### Backend Error Response (ALWAYS use this format)

```js
// ✅ REQUIRED format for ALL error responses
res.status(400).json({ success: false, message: 'Specific error description.' });
res.status(401).json({ success: false, message: 'Authentication required.' });
res.status(403).json({ success: false, message: 'Insufficient permissions.' });
res.status(404).json({ success: false, message: 'Resource not found.' });
res.status(409).json({ success: false, message: 'Conflict description.' });
res.status(422).json({ success: false, message: 'Business rule violation.' });
res.status(500).json({ success: false, message: 'Internal server error.' });
```

### Backend Success Response

```js
// ✅ Single item
res.status(200).json({ success: true, data: item });

// ✅ Created
res.status(201).json({ success: true, message: 'Created successfully.', data: newItem });

// ✅ List
res.status(200).json({ success: true, data: items, pagination: { ... } });
```

### Error Handling in Controllers

```js
// ✅ REQUIRED pattern
const createOrder = async (req, res, next) => {
  try {
    const result = await ordersService.createOrder(req.validatedBody);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    // Pass to global error handler — let it determine status code
    next(error);
  }
};
```

---

## 5. Naming Conventions (Enforced)

### Database

```
Tables:        snake_case plural    (users, orders, product_variants)
Columns:       snake_case           (user_id, order_status, created_at)
Primary key:   always "id"          (id UUID)
Foreign key:   {table_singular}_id  (order_id, user_id)
```

### Backend Files

```
Routes:        {domain}.routes.js
Controllers:   {domain}.controller.js
Services:      {domain}.service.js
Repositories:  {domain}.repository.js
Schemas:       {domain}.schema.js
Middleware:    {name}.middleware.js
```

### Frontend Files

```
React components:  PascalCase.jsx         (ProductCard.jsx)
Pages:             PascalCase + Page.jsx  (CheckoutPage.jsx)
Redux slices:      camelCaseSlice.js      (cartSlice.js)
Hooks:             use + PascalCase.js    (useAuth.js)
Utilities:         camelCase.js           (formatCurrency.js)
Constants:         UPPER_SNAKE_CASE       (APP_ROLES, ORDER_STATUS)
```

---

## 6. Code Generation Standards

### When Adding a New API Endpoint

Generate in this order:
1. **Schema** (`{domain}.schema.js`) — Zod validation schema
2. **Repository function** (`{domain}.repository.js`) — DB query
3. **Service function** (`{domain}.service.js`) — business logic
4. **Controller method** (`{domain}.controller.js`) — HTTP handler
5. **Route** (`{domain}.routes.js`) — wire up with middleware

### When Adding a New Frontend Feature

Generate in this order:
1. **Redux slice** (`{domain}Slice.js`) — state + thunks
2. **Components** — presentational first, then connected
3. **Page** — compose components, connect to store
4. **Route registration** — in `app/router.jsx`

### When Adding a Database Column

Always:
1. Add to schema migration file (new `.sql` file with timestamp prefix)
2. Update the affected repository function
3. Update `docs/database_schema.md`
4. Never use `camelCase` column names — only `snake_case`

---

## 7. Context Handling Rules

When the AI assistant does not have enough context to safely generate code:

1. **ASK** what domain/module is being worked on
2. **READ** the relevant existing files before generating code
3. **REFERENCE** this documentation and existing patterns
4. **NEVER guess** at database column names — check `schema.sql`
5. **NEVER guess** at API endpoint paths — check `server.js` and routes

### File Reading Priority

Before generating code for a module, read:
1. The existing controller file for that domain
2. The existing routes file for that domain
3. The schema.sql to understand DB structure
4. Any related slice or component if frontend work

---

## 8. Consistency Rules

### DO NOT Introduce New Patterns Without Documenting

If generating code that introduces a new pattern:
1. Flag it explicitly: "This introduces a new pattern: [X]"
2. Explain why the existing pattern is insufficient
3. Propose updating this `ai_rules.md` and `architecture.md`

### Follow Existing Patterns

Look at existing files in the same domain before generating code. If there's already a pattern:
- `order-controller.js` → follow the same try/catch structure
- `cartSlice.js` → follow the same `pending/fulfilled/rejected` reducer structure
- `auth.middleware.js` → follow the same authenticate/authorize middleware pattern

---

## 9. Security Checklist for AI-Generated Code

Before finalizing any generated code, verify:

- [ ] No hardcoded secrets (use `process.env.VAR_NAME`)
- [ ] No `req.body` passed directly to DB update (whitelist fields)
- [ ] All admin/member routes protected with `authenticate` + `authorizeRoles`
- [ ] Input validation exists (Zod schema or explicit checks)
- [ ] Error responses use correct HTTP status codes
- [ ] No `password`, `midtrans_server_key`, or other secrets in API responses
- [ ] No MongoDB legacy `_id` field mapping

---

## 10. Domain Knowledge for AI Context

### Business Domain
- **OMAHRING** = "Omah Ring" = a shop focused on ornamental (singing) birds (burung kicau)
- **Primary market**: Mojokerto, East Java, Indonesia
- **Currency**: IDR (Indonesian Rupiah) — all prices in integer IDR (no decimals)
- **Payment gateway**: Midtrans Snap (Indonesian payment aggregator)
- **Shipping**: RajaOngkir (Indonesian shipping cost calculator)
- **Language**: Primary UI in Bahasa Indonesia; i18n supports English (en) and Malay (ms)

### Role Model
```
guest → user → member → admin → manager
```
- `guest`: no account, uses sessionId for cart
- `user`: registered, can buy products
- `member`: premium, exclusive content + bird profiles
- `admin`: store operator
- `manager`: store owner, full access

### Key Business Rules
1. Cart is identified by `user_id` (logged in) or `session_id` (guest)
2. On login, guest cart must be merged with user cart
3. Orders use Midtrans Snap with dynamic payment category fees
4. Midtrans webhook MUST verify SHA-512 signature before processing
5. Membership upgrade MUST be authenticated and tied to a payment
6. Bird profiles are only creatable by `member` role users
7. Articles can be `member_only` — check role before returning

---

## 11. Do Not Normalize Current Anti-Patterns

If asked to add code that follows current bad patterns, flag it:

```
⚠️ AI NOTE: The existing code does [X anti-pattern].
I can either:
  A) Follow the existing pattern (faster, but perpetuates technical debt)
  B) Follow the ideal pattern from docs/architecture.md (cleaner, requires more change)

Recommendation: [B] if this module will be refactored; [A] if this is a quick fix.
```

---

*Last updated: 2026-05-11 | Generated by architecture audit*
