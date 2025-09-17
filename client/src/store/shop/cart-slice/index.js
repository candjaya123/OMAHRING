import api from "../../../utils/axios";;
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  cartItems: { items: [], cartTotal: 0 }, // Sesuaikan dengan struktur data yang benar
  isLoading: false,
  error: null,
};

// =============================
// ADD TO CART
// =============================
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ userId, productId, quantity, variant }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/shop/cart/add",
        {
          userId,
          productId,
          quantity,
          variant, // 👈 wajib dikirim
        }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// =============================
// FETCH CART
// =============================
export const fetchCartItems = createAsyncThunk(
  "cart/fetchCartItems",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/shop/cart/get/${id}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// =============================
// DELETE CART ITEM
// =============================
export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async ({ userId, productId, variantName }, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/shop/cart/${userId}/${productId}/${variantName}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// =============================
// UPDATE CART QUANTITY
// =============================
export const updateCartQuantity = createAsyncThunk(
  "cart/updateCartQuantity",
  async ({ userId, productId, variantName, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        "/shop/cart/update-cart",
        {
          id: userId,
          productId,
          variantName,
          quantity,
        }
      );
      return response.data;
    } catch (err)      {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// =============================
// SLICE
// =============================
const shoppingCartSlice = createSlice({
  name: "shoppingCart",
  initialState,
  // 🔹 BAGIAN PENTING DITAMBAHKAN DI SINI 🔹
  reducers: {
    clearCart: (state) => {
      state.cartItems = { items: [], cartTotal: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      // ADD TO CART
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.data;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // FETCH CART
      .addCase(fetchCartItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.isLoading = false;
        // Pastikan state diupdate dengan benar jika data tidak ada
        state.cartItems = action.payload.data || { items: [], cartTotal: 0 };
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // UPDATE CART QUANTITY
      .addCase(updateCartQuantity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.data;
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // DELETE CART ITEM
      .addCase(deleteCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.data;
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// 🔹 PASTIKAN ANDA MENGEKSPOR ACTION-NYA 🔹
export const { clearCart } = shoppingCartSlice.actions;

export default shoppingCartSlice.reducer;