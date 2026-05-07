const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const authRouter = require("./routes/auth/auth-routes");
const adminProductsRouter = require("./routes/admin/products-routes");
const adminOrderRouter = require("./routes/admin/order-routes");
const adminUserRouter = require("./routes/admin/user-routes");
const adminPromoRouter = require("./routes/admin/promo-routes");
const adminStaffRouter = require("./routes/admin/staff-routes");
const adminAnalyticsRouter = require("./routes/admin/analytics-routes");
const adminArticleRouter = require("./routes/admin/article-routes");
const adminCategoryRouter = require("./routes/admin/category-routes"); // 🔹 Impor router kategori
const adminSettingsRouter = require("./routes/admin/settings-routes");
const shopProductsRouter = require("./routes/shop/products-routes");
const shopCartRouter = require("./routes/shop/cart-routes");
const shopAddressRouter = require("./routes/shop/address-routes");
const shopOrderRouter = require("./routes/shop/order-routes");
const shopSearchRouter = require("./routes/shop/search-routes");
const shopReviewRouter = require("./routes/shop/review-routes");
const shopShippingRouter = require("./routes/shop/shipping-routes");
const shopCommonRouter = require("./routes/shop/common-routes");
const shopBirdRouter = require("./routes/shop/bird-routes");
const shopChatRouter = require("./routes/shop/chat-routes");

const commonFeatureRouter = require("./routes/common/feature-routes");

// Connect to Database (Supabase handled via config/supabase.js)
console.log("✅ Supabase client initialized (connected via API)");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5005;

// --- Middleware ---
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://omahring.com",
        "https://www.omahring.com",
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// --- Routes ---
app.use("/api/auth", authRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/articles", adminArticleRouter);
app.use("/api/admin/categories", adminCategoryRouter); // 🔹 Daftarkan endpoint kategori
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/users", adminUserRouter);
app.use("/api/admin/promos", adminPromoRouter);
app.use("/api/admin/staff", adminStaffRouter);
app.use("/api/admin/analytics", adminAnalyticsRouter);
app.use("/api/admin/settings", adminSettingsRouter);
app.use("/api/shop/products", shopProductsRouter);
app.use("/api/shop/cart", shopCartRouter);
app.use("/api/shop/address", shopAddressRouter);
app.use("/api/shop/order", shopOrderRouter);
app.use("/api/shop/search", shopSearchRouter);
app.use("/api/shop/review", shopReviewRouter);
app.use("/api/shop/shipping", shopShippingRouter);
app.use("/api/shop/common", shopCommonRouter);
app.use("/api/shop/birds", shopBirdRouter);
app.use("/api/shop/chat", shopChatRouter);

app.use("/api/common/feature", commonFeatureRouter);

// --- Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is now running on port ${PORT}`);
});
