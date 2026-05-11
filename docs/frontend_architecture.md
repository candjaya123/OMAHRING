# OMAHRING — Frontend Architecture

> **Who should read this:** Frontend engineers, AI assistants working on the client layer.  
> **Why it matters:** Frontend complexity explodes as features grow without discipline. This document defines the rules that keep the frontend maintainable at scale.

---

## 1. Current Problems

| Problem | Details |
|---|---|
| **Mixed page/component responsibilities** | Pages like `checkout.jsx` (36KB) contain API calls, business logic, state management, and UI all in one file |
| **Admin product page is a god file** | `pages/admin-view/products.jsx` is 33KB — contains form state, validation, upload handling, table rendering, modals |
| **No component hierarchy standard** | Admin components mixed with shop components with no clear shared component layer |
| **Redux without normalization** | Product lists stored as raw arrays — no `entities/ids` pattern from `createEntityAdapter` |
| **No lazy loading** | All pages imported eagerly in `App.jsx` — initial bundle grows with every new page |
| **No TypeScript** | No type safety on props, API responses, or Redux state |
| **Session ID logic in App.jsx** | Guest session management belongs in auth module, not root App component |
| **i18n only partially applied** | Some components use hardcoded Bahasa Indonesia strings |
| **`{' '}` JSX whitespace artifacts** | Multiple instances of stray `{' '}` in `App.jsx` route definitions |

---

## 2. Ideal Feature-Sliced Architecture

```
client/src/
├── app/
│   ├── store.js            ← Redux store configuration
│   ├── router.jsx          ← All route definitions in one place
│   └── providers.jsx       ← Redux Provider, Router, i18n wrapper
│
├── features/               ← Feature-based module organization
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── AuthLayout.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── store/
│   │   │   ├── authSlice.js        ← State, reducers, thunks
│   │   │   └── authSelectors.js    ← Memoized selectors
│   │   └── hooks/
│   │       └── useAuth.js
│   │
│   ├── shop/
│   │   ├── catalog/
│   │   │   ├── components/
│   │   │   │   ├── ProductCard.jsx
│   │   │   │   ├── ProductGrid.jsx
│   │   │   │   └── FilterPanel.jsx
│   │   │   ├── pages/
│   │   │   │   ├── ListingPage.jsx
│   │   │   │   ├── ProductDetailPage.jsx
│   │   │   │   └── SearchPage.jsx
│   │   │   └── store/
│   │   │       └── productsSlice.js
│   │   ├── cart/
│   │   │   ├── components/
│   │   │   │   ├── CartDrawer.jsx
│   │   │   │   ├── CartItem.jsx
│   │   │   │   └── CartSummary.jsx
│   │   │   └── store/
│   │   │       └── cartSlice.js
│   │   ├── checkout/
│   │   │   ├── components/
│   │   │   │   ├── AddressStep.jsx
│   │   │   │   ├── ShippingStep.jsx
│   │   │   │   └── PaymentStep.jsx
│   │   │   └── pages/
│   │   │       ├── CheckoutPage.jsx
│   │   │       └── PaymentPendingPage.jsx
│   │   ├── orders/
│   │   │   ├── components/
│   │   │   │   ├── OrderCard.jsx
│   │   │   │   └── OrderStatusBadge.jsx
│   │   │   └── store/
│   │   │       └── ordersSlice.js
│   │   └── birds/
│   │       ├── components/
│   │       │   ├── BirdCard.jsx
│   │       │   └── BirdProfileView.jsx
│   │       └── pages/
│   │           └── BirdProfilePage.jsx
│   │
│   ├── member/
│   │   ├── dashboard/
│   │   │   └── pages/
│   │   │       └── MemberDashboardPage.jsx
│   │   └── articles/
│   │       └── pages/
│   │           └── MemberArticlesPage.jsx
│   │
│   └── admin/
│       ├── products/
│       │   ├── components/
│       │   │   ├── ProductForm.jsx        ← Extracted from god file
│       │   │   ├── ProductTable.jsx
│       │   │   ├── VariantEditor.jsx
│       │   │   └── ImageUploader.jsx
│       │   └── pages/
│       │       └── AdminProductsPage.jsx
│       ├── orders/
│       ├── customers/
│       ├── analytics/
│       ├── chat/
│       ├── settings/
│       └── staff/
│
├── shared/
│   ├── components/             ← Reusable, domain-agnostic UI
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── DataTable.jsx
│   │   ├── Pagination.jsx
│   │   ├── StatusBadge.jsx
│   │   └── ConfirmDialog.jsx
│   ├── hooks/
│   │   ├── useDebounce.js
│   │   ├── usePagination.js
│   │   └── useLocalStorage.js
│   ├── utils/
│   │   ├── formatCurrency.js
│   │   ├── formatDate.js
│   │   └── validators.js
│   ├── api/
│   │   └── axiosInstance.js    ← Single Axios instance with interceptors
│   └── constants/
│       ├── roles.js            ← APP_ROLES enum
│       ├── routes.js           ← ROUTES constants
│       └── orderStatus.js      ← ORDER_STATUS enum
│
└── locales/                    ← i18n translation files
    ├── id.json
    ├── en.json
    └── ms.json
```

---

## 3. State Management Rules

### Redux Toolkit Conventions

```js
// ✅ Standard slice structure
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/shared/api/axiosInstance';

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/shop/products', { params });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Unknown error' });
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    selectedProduct: null,
    isLoading: false,
    error: null,
    pagination: { page: 1, total: 0 },
  },
  reducers: {
    clearSelectedProduct: (state) => { state.selectedProduct = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message;
      });
  },
});
```

### State Shape Rules

- Each slice manages ONE domain only
- Never store raw API response objects — normalize the shape
- Loading, error, and data states are ALWAYS present
- Selectors MUST be co-located in `{slice}Selectors.js`

---

## 4. Component Hierarchy

```
Pages           ← Composed of features; handle routing
  └── Features  ← Business-specific components; use store
        └── Shared Components  ← Pure UI; no store access, receive props only
```

**Rules:**
- Shared components MUST NOT import from Redux store
- Pages MUST NOT contain raw business logic (extract to hooks or services)
- Components over 200 lines MUST be split into smaller sub-components

---

## 5. Routing Architecture

```jsx
// ✅ Ideal: Lazy-loaded routes with React.lazy
import { lazy, Suspense } from 'react';
const AdminProductsPage = lazy(() => import('@/features/admin/products/pages/AdminProductsPage'));

<Route 
  path="products" 
  element={
    <Suspense fallback={<PageLoader />}>
      <AdminProductsPage />
    </Suspense>
  } 
/>
```

### Route Guard Pattern

```jsx
// components/guards/RoleGuard.jsx
const RoleGuard = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useSelector(selectAuth);
  
  if (!isAuthenticated) return <Navigate to="/auth/login" />;
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/unauth-page" />;
  
  return children;
};

// Usage
<Route path="admin/*" element={
  <RoleGuard allowedRoles={['admin', 'manager']}>
    <AdminLayout />
  </RoleGuard>
} />
```

---

## 6. UI Composition Standards

### Design Token System (TailwindCSS)

Define semantic tokens in `tailwind.config.js`:

```js
// ✅ Use semantic color tokens
theme: {
  extend: {
    colors: {
      primary: { DEFAULT: '#...', dark: '#...', light: '#...' },
      surface: { DEFAULT: '#...', muted: '#...' },
      danger: { DEFAULT: '#...' },
    }
  }
}

// ✅ Use semantic token classes
<button className="bg-primary text-white hover:bg-primary-dark">

// ❌ Don't use raw utility colors for brand colors
<button className="bg-yellow-500 hover:bg-yellow-600">
```

### Component Patterns

```jsx
// ✅ Shared Button component with variants
// shared/components/Button.jsx
const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  return (
    <button 
      className={cn(buttonVariants({ variant, size }))}
      {...props}
    >
      {children}
    </button>
  );
};
```

---

## 7. Responsive Strategy

- Mobile-first: base styles target mobile, `md:` and `lg:` for desktop
- Admin panel: optimized for desktop (min-width: 1024px)
- Shop/public: fully responsive (320px to 1440px)
- Use CSS Grid + Flexbox (Tailwind `grid`, `flex` utilities)
- No fixed pixel widths on container elements — use `max-w-*` + `mx-auto`

---

## 8. i18n Standards

All user-facing strings MUST be internationalized:

```jsx
// ✅ Good
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<button>{t('checkout.placeOrder')}</button>

// ❌ Bad — hardcoded string
<button>Buat Pesanan</button>
```

Translation key naming convention:
```
{feature}.{component}.{element}
// Examples:
checkout.paymentStep.selectMethod
product.detail.addToCart
admin.orders.statusLabel
```

---

## 9. Refactor Direction

### Immediate (Low risk)
1. Remove `{' '}` whitespace artifacts from `App.jsx`
2. Move session ID logic from `App.jsx` to `authSlice`
3. Add React.lazy() for all route-level pages
4. Create `axiosInstance.js` with base URL and credential config

### Medium-term
5. Extract `ProductForm`, `VariantEditor`, `ImageUploader` from `admin/products.jsx`
6. Extract `CheckoutForm` steps from `checkout.jsx`
7. Create `shared/components/` directory with Button, Modal, DataTable, Pagination

### Long-term
8. Migrate to TypeScript
9. Implement RTK Query to replace manual thunk + axios patterns
10. Add React Testing Library tests for critical components
11. Implement feature-sliced folder structure fully

---

*Last updated: 2026-05-11 | Generated by architecture audit*

---

## 10. Chat Context Tags — Frontend Implementation

> **Reference:** ADR-007 | Chat sessions carry product/article context set at the moment the widget opens.

### 10.1 Hook: `useChatContext`

A shared hook that reads the current page context and returns a structured `context` object for session creation. Used by the chat widget on any page.

```jsx
// shared/hooks/useChatContext.js

import { useParams, useLocation } from 'react-router-dom';

/**
 * Detects what the user is currently viewing and returns
 * a context payload for chat session creation.
 *
 * @returns {{ type: string, id: string|null, title: string|null, url: string }}
 */
const useChatContext = (contextOverride = null) => {
  const location = useLocation();

  // Allow explicit override (e.g., from ProductDetailPage)
  if (contextOverride) {
    return {
      type: contextOverride.type,
      id: contextOverride.id,
      title: contextOverride.title,
      url: location.pathname,
    };
  }

  // Auto-detect from URL pattern (fallback)
  return { type: 'general', id: null, title: null, url: location.pathname };
};

export default useChatContext;
```

### 10.2 Usage on Product Detail Page

```jsx
// features/shop/catalog/pages/ProductDetailPage.jsx

import useChatContext from '@/shared/hooks/useChatContext';
import ChatWidget from '@/shared/components/ChatWidget';

const ProductDetailPage = () => {
  const { product } = useSelector(selectCurrentProduct);

  // Build context from current product data
  const chatContext = useChatContext(
    product
      ? { type: 'product', id: product.id, title: product.title }
      : null
  );

  return (
    <div>
      {/* ... product content ... */}

      {/* Chat widget receives context — injected at session start */}
      <ChatWidget context={chatContext} />
    </div>
  );
};
```

### 10.3 Usage on Article Page

```jsx
// features/shop/articles/pages/ArticleDetailPage.jsx

const ArticleDetailPage = () => {
  const { article } = useSelector(selectCurrentArticle);

  const chatContext = useChatContext(
    article
      ? { type: 'article', id: article.id, title: article.title }
      : null
  );

  return (
    <div>
      {/* ... article content ... */}
      <ChatWidget context={chatContext} />
    </div>
  );
};
```

### 10.4 ChatWidget Component

```jsx
// shared/components/ChatWidget.jsx

import { useDispatch, useSelector } from 'react-redux';
import { startChatSession } from '@/store/shop/chat-slice';

const ChatWidget = ({ context = null }) => {
  const dispatch = useDispatch();
  const { sessionId } = useSelector(state => state.chatSlice);

  const handleOpen = async () => {
    if (!sessionId) {
      // Pass context only on first session creation
      await dispatch(startChatSession({
        customer_id: user?.id || null,
        session_token: guestSessionId,
        context: context || undefined,  // undefined = general chat
      }));
    }
  };

  return (
    <button onClick={handleOpen} className="chat-fab">
      💬 Chat
    </button>
  );
};

export default ChatWidget;
```

> **Rule:** `context` is passed to `startChatSession` **only once** at session creation. If a session already exists (`sessionId` is set in Redux), the widget opens the existing session without re-sending context. This prevents overwriting the original context.

### 10.5 Redux Slice Update (`chat-slice.js`)

```js
// Update startChatSession thunk to forward context
export const startChatSession = createAsyncThunk(
  '/chat/startChatSession',
  async ({ customer_id, session_token, context }, { getState }) => {
    const payload = { customer_id, session_token };

    // Only attach context if provided
    if (context?.type && context.type !== 'general') {
      payload.context = context;
    }

    const response = await api.post('/chat/start', payload);
    return response.data;
  }
);
```

Update the fulfilled reducer to store context in session state:

```js
// In chat-slice initialState, add:
const initialState = {
  isLoading: false,
  sessionId: null,
  sessionContext: null,   // ← NEW: { type, id, title, url }
  messages: [],
  allSessions: [],
  unreadCount: 0,
};

// In fulfilled case:
.addCase(startChatSession.fulfilled, (state, action) => {
  state.isLoading = false;
  state.sessionId = action.payload.data.sessionId;
  state.sessionContext = action.payload.data.context || null;  // ← NEW
})
```

### 10.6 Admin UI — Session Context Badge

In the admin chat session list, render a clickable badge for sessions that have context:

```jsx
// features/admin/chat/components/SessionContextBadge.jsx

const contextLabels = {
  product: { label: 'Produk', icon: '📦', color: 'bg-blue-100 text-blue-800' },
  article: { label: 'Artikel', icon: '📄', color: 'bg-green-100 text-green-800' },
  general: null,  // No badge for general sessions
};

const SessionContextBadge = ({ context }) => {
  if (!context || context.type === 'general') return null;

  const config = contextLabels[context.type];
  if (!config) return null;

  return (
    <a
      href={context.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      title={`Buka ${config.label}: ${context.title}`}
    >
      <span>{config.icon}</span>
      <span>[{config.label}]</span>
      <span className="truncate max-w-[160px]">{context.title}</span>
      <span>→</span>
    </a>
  );
};

export default SessionContextBadge;
```

**Usage in session list:**
```jsx
// features/admin/chat/pages/AdminChatPage.jsx
{sessions.map(session => (
  <div key={session.sessionId} className="session-row">
    <span>{session.customerName}</span>
    <SessionContextBadge context={session.context} />
    <span className="last-message">{session.lastMessage}</span>
  </div>
))}
```

### 10.7 Pages That Should Attach Context

| Page | Context Type | Source |
|---|---|---|
| `/shop/products/:id` | `product` | `product.id`, `product.title` from Redux |
| `/shop/articles/:id` | `article` | `article.id`, `article.title` from Redux |
| All other pages | `general` | No context — widget uses default |

---
