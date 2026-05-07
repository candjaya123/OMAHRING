import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../utils/axios";

const initialState = {
  isLoading: false,
  stats: {
    totalProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    newOrders: 0,
    dailySales: [],
    recentProducts: [],
  },
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  "/analytics/fetchDashboardStats",
  async () => {
    const response = await api.get("/admin/analytics/stats");
    return response.data;
  }
);

const adminAnalyticsSlice = createSlice({
  name: "adminAnalytics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.data;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.stats = initialState.stats;
        state.error = action.error.message;
      });
  },
});

export default adminAnalyticsSlice.reducer;
