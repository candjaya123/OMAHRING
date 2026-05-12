const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const env = require('./config/env');
const errorMiddleware = require('./middleware/error.middleware');

// --- Domain Modules (Target Architecture) ---
const authRouter = require('./modules/auth/auth.routes');
const productsRouter = require('./modules/products/products.routes');
const cartRouter = require('./modules/cart/cart.routes');
const chatRouter = require('./modules/chat/chat.routes');
const birdsRouter = require('./modules/birds/birds.routes');
const articlesRouter = require('./modules/articles/articles.routes');
const analyticsRouter = require('./modules/analytics/analytics.routes');
const promosRouter = require('./modules/promos/promos.routes');
const settingsRouter = require('./modules/settings/settings.routes');
const membersRouter = require('./modules/members/members.routes');
const ordersRouter = require('./modules/orders/orders.routes');
const pageContentsRouter = require('./modules/page-contents/page-contents.routes');

const app = express();

// --- Configuration ---
app.set('trust proxy', 1);
const PORT = env.PORT;

// --- Global Middleware ---
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://omahring.com',
        'https://www.omahring.com',
        env.CLIENT_URL,
        env.FRONTEND_URL,
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Expires',
      'Pragma',
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// --- Routes ---

// 1. Auth Module
app.use('/api/auth', authRouter);

// 2. Domain Modules (V1)
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/chat', chatRouter);
app.use('/api/birds', birdsRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/promos', promosRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/members', membersRouter);
app.use('/api/page-contents', pageContentsRouter);

// 3. Aliases for Legacy Compatibility
app.use('/api/admin/products', productsRouter);
app.use('/api/admin/articles', articlesRouter);
app.use('/api/admin/orders', ordersRouter);
app.use('/api/admin/users', membersRouter);
app.use('/api/admin/promos', promosRouter);
app.use('/api/admin/analytics', analyticsRouter);
app.use('/api/admin/settings', settingsRouter);

app.use('/api/shop/products', productsRouter);
app.use('/api/shop/cart', cartRouter);
app.use('/api/shop/order', ordersRouter);
app.use('/api/shop/birds', birdsRouter);
app.use('/api/shop/chat', chatRouter);

// --- Global Error Handler ---
app.use(errorMiddleware);

// --- Server ---
app.listen(PORT, () => {
  console.log(`🚀 OMAHRING Server is running on port ${PORT} [${env.NODE_ENV}]`);
});
