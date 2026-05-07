import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth-slice';
import adminProductsSlice from './admin/products-slice';
import adminOrderSlice from './admin/order-slice';
import adminUsersSlice from './admin/users-slice'; // 🔹 1. Impor slice baru di sini
import adminPromosSlice from './admin/promo-slice'; // 🔹 1. Impor slice promo
import adminStaffSlice from './admin/staff-slice';
import adminAnalyticsSlice from './admin/analytics-slice';
import adminArticleSlice from './admin/article-slice'; // 🔹 Impor slice artikel
import adminCategorySlice from './admin/category-slice'; // 🔹 Impor slice kategori

import shopProductsSlice from './shop/products-slice';
import shopCartSlice from './shop/cart-slice';
import shopAddressSlice from './shop/address-slice';
import shopOrderSlice from './shop/order-slice';
import shopSearchSlice from './shop/search-slice';
import shopReviewSlice from './shop/review-slice';
import shopCommonSlice from './shop/common-slice';
import shopBirdSlice from './shop/bird-slice';
import shopContentSlice from './shop/content-slice';
import shopChatSlice from './shop/chat-slice';
import commonFeatureSlice from './common-slice';

const store = configureStore({
  reducer: {
    auth: authReducer,

    adminProducts: adminProductsSlice,
    adminOrder: adminOrderSlice,
    adminUsers: adminUsersSlice, // 🔹 2. Tambahkan reducer baru di sini
    adminPromos: adminPromosSlice, // 🔹 2. Tambahkan reducer promo
    adminStaff: adminStaffSlice,
    adminAnalytics: adminAnalyticsSlice,
    adminArticle: adminArticleSlice, // 🔹 Tambahkan reducer artikel
    adminCategory: adminCategorySlice, // 🔹 Tambahkan reducer kategori

    shopProducts: shopProductsSlice,
    shopCart: shopCartSlice,
    shopAddress: shopAddressSlice,
    shopOrder: shopOrderSlice,
    shopSearch: shopSearchSlice,
    shopReview: shopReviewSlice,
    shopCommon: shopCommonSlice,
    shopBird: shopBirdSlice,
    shopContent: shopContentSlice,
    shopChat: shopChatSlice,
    commonFeature: commonFeatureSlice,
  },
});

export default store;
