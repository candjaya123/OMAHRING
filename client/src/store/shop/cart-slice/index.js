import api from '../../../utils/axios';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  cartItems: { items: [], cartTotal: 0 },
  isLoading: false,
  error: null,
  sessionId: null,
};

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ userId, sessionId, productId, quantity, variant }, { rejectWithValue }) => {
    try {
      const response = await api.post('/shop/cart/add', {
        userId: userId || null,
        sessionId: sessionId || null,
        productId,
        quantity,
        variant,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const fetchCartItems = createAsyncThunk(
  'cart/fetchCartItems',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/shop/cart/get/${id}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const deleteCartItem = createAsyncThunk(
  'cart/deleteCartItem',
  async ({ id, productId, variantName }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/shop/cart/${id}/${productId}/${variantName}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  'cart/updateCartQuantity',
  async ({ userId, sessionId, productId, variantName, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.put('/shop/cart/update-cart', {
        userId,
        sessionId,
        productId,
        variantName,
        quantity,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const mergeCart = createAsyncThunk(
  'cart/mergeCart',
  async ({ userId, sessionId, action }, { rejectWithValue }) => {
    try {
      const response = await api.post('/shop/cart/merge-cart', {
        userId,
        sessionId,
        action,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

const shoppingCartSlice = createSlice({
  name: 'shoppingCart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.cartItems = { items: [], cartTotal: 0 };
      state.sessionId = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.success) {
          state.cartItems = action.payload.data || { items: [], cartTotal: 0 };
          if (action.payload.data?.sessionId) {
            state.sessionId = action.payload.data.sessionId;
          }
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Gagal menambahkan ke keranjang';
      })

      .addCase(fetchCartItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.success) {
          state.cartItems = action.payload.data || { items: [], cartTotal: 0 };
        }
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Gagal memuat keranjang';
      })

      .addCase(updateCartQuantity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.success) {
          state.cartItems = action.payload.data || { items: [], cartTotal: 0 };
        }
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Gagal mengupdate keranjang';
      })

      .addCase(deleteCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.success) {
          state.cartItems = action.payload.data || { items: [], cartTotal: 0 };
        }
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Gagal menghapus item';
      });
  },
});

export const { clearCart, clearError, setSessionId } = shoppingCartSlice.actions;
export default shoppingCartSlice.reducer;
