import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../../utils/axios';

const initialState = {
  isLoading: false, // 🔹 Menambahkan state isLoading
  orderList: [],
  orderDetails: null,
  error: null, // 🔹 Menambahkan state untuk error
};

export const getAllOrdersForAdmin = createAsyncThunk('/order/getAllOrdersForAdmin', async () => {
  const response = await api.get(`/admin/orders/get`);
  return response.data;
});

export const getOrderDetailsForAdmin = createAsyncThunk(
  '/order/getOrderDetailsForAdmin',
  async (id) => {
    const response = await api.get(`/admin/orders/details/${id}`);
    return response.data;
  }
);

export const updateOrderStatus = createAsyncThunk(
  '/order/updateOrderStatus',
  async ({ id, orderStatus }) => {
    const response = await api.put(`/admin/orders/update/${id}`, { orderStatus });
    return response.data;
  }
);

const adminOrderSlice = createSlice({
  name: 'adminOrder', // Nama slice sebaiknya konsisten (camelCase)
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Orders
      .addCase(getAllOrdersForAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllOrdersForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderList = action.payload.data;
      })
      .addCase(getAllOrdersForAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Get Order Details
      .addCase(getOrderDetailsForAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrderDetailsForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetailsForAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orderList.findIndex((order) => order._id === action.payload._id);
        if (index !== -1) {
          state.orderList[index] = action.payload;
        }
        state.orderDetails = action.payload;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetOrderDetails } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;
