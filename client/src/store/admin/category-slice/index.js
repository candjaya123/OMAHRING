import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../utils/axios";

const initialState = {
  isLoading: false,
  categoryList: [],
};

export const addCategory = createAsyncThunk(
  "/admin/addCategory",
  async (formData) => {
    const response = await api.post("/admin/categories/add", formData);
    return response.data;
  }
);

export const fetchAllCategories = createAsyncThunk(
  "/admin/fetchAllCategories",
  async () => {
    const response = await api.get("/admin/categories/get");
    return response.data;
  }
);

const adminCategorySlice = createSlice({
  name: "adminCategory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categoryList = action.payload.data;
      })
      .addCase(fetchAllCategories.rejected, (state) => {
        state.isLoading = false;
        state.categoryList = [];
      });
  },
});

export default adminCategorySlice.reducer;
