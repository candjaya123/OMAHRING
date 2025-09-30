import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../../utils/axios';

// =============================
// INITIAL STATE (GABUNGAN)
// =============================
const initialState = {
  isLoading: false,
  error: null,

  // State untuk alur belanja (Shop)
  token: null, // Untuk Midtrans Snap
  redirectUrl: null,
  orderId: null, // ID pesanan yang baru dibuat
  userOrderList: [], // Daftar pesanan untuk satu pengguna

  // State untuk panel admin
  adminOrderList: [], // Daftar semua pesanan untuk admin
  orderDetails: null, // Detail pesanan yang sedang dilihat (digunakan bersama)
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  },
  stats: {
    pending: 0,
    confirmed: 0,
    totalRevenue: 0,
  },
};

// =================================================================
// THUNKS UNTUK TOKO (SHOP)
// =================================================================

export const createNewOrder = createAsyncThunk(
  'orders/createNew',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/shop/order/create', orderData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data.message || 'Gagal membuat pesanan');
    }
  }
);

export const getAllOrdersByUserId = createAsyncThunk(
  'orders/fetchAllByUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/shop/order/list/${userId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Gagal mengambil riwayat pesanan');
    }
  }
);

export const verifyPaymentStatus = createAsyncThunk(
  'orders/verifyPaymentStatus',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/shop/order/details/${orderId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Gagal memverifikasi pembayaran');
    }
  }
);

// =================================================================
// THUNKS UNTUK ADMIN
// =================================================================

export const getAllOrdersForAdmin = createAsyncThunk(
  'orders/fetchAllForAdmin',
  async ({ page = 1, limit = 10, status = '' }, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/orders/get', {
        params: { page, limit, status },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Gagal mengambil pesanan admin');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, orderStatus }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/orders/update/${id}`, { orderStatus });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Gagal memperbarui status');
    }
  }
);

export const fetchOrderStats = createAsyncThunk(
  'orders/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/orders/stats');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Gagal mengambil statistik');
    }
  }
);

// =================================================================
// THUNK BERSAMA (SHARED)
// =================================================================

export const getOrderDetails = createAsyncThunk(
  'orders/fetchDetails',
  async ({ id, isAdmin = false }, { rejectWithValue }) => {
    try {
      const url = isAdmin ? `/admin/orders/details/${id}` : `/shop/order/details/${id}`;
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Gagal mengambil detail pesanan');
    }
  }
);

export const regenerateSnapToken = createAsyncThunk(
  'orders/regenerateSnapToken',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/shop/order/${orderId}/regenerate-token`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Gagal regenerate Snap token');
    }
  }
);

// =============================
// SLICE
// =============================
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    resetOrderState: (state) => {
      state.token = null;
      state.redirectUrl = null;
      state.orderId = null;
      state.orderDetails = null;
      state.error = null;
    },
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 SEMUA .addCase DITEMPATKAN DI ATAS 🔹
      // CREATE NEW ORDER (SHOP)
      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.redirectUrl = action.payload.redirect_url;
        state.orderId = action.payload.orderId;
        localStorage.setItem('sessionId', action.payload.userId);
        sessionStorage.setItem('currentOrderId', action.payload.orderId);
      })
      // GET ORDERS BY USER (SHOP)
      .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userOrderList = action.payload.data;
      })
      // VERIFY PAYMENT (SHOP)
      .addCase(verifyPaymentStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data;
      })
      // GET ALL ORDERS (ADMIN)
      .addCase(getAllOrdersForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminOrderList = action.payload.data;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalOrders: action.payload.totalOrders,
        };
      })
      // GET DETAILS (SHARED)
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(regenerateSnapToken.fulfilled, (state, action) => {
        state.token = action.payload.token; // Simpan token baru di Redux
        state.isLoading = false;
      })
      // UPDATE STATUS (ADMIN)
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedOrder = action.payload.data;
        const index = state.adminOrderList.findIndex((order) => order._id === updatedOrder._id);
        if (index !== -1) {
          state.adminOrderList[index] = updatedOrder;
        }
        if (state.orderDetails?._id === updatedOrder._id) {
          state.orderDetails = updatedOrder;
        }
      })
      // FETCH STATS (ADMIN)
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      })
      // 🔹 SEMUA .addMatcher DITEMPATKAN DI BAWAH 🔹
      // Kasus umum untuk pending dan rejected
      .addMatcher(
        (action) => action.type.startsWith('orders/') && action.type.endsWith('/pending'),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('orders/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { resetOrderState, resetOrderDetails } = orderSlice.actions;
export default orderSlice.reducer;
