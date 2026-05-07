import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../utils/axios";

const initialState = {
  isLoading: false,
  articleList: [],
  categoryList: [],
};

export const fetchArticles = createAsyncThunk(
  "/shop/articles/fetch",
  async () => {
    const response = await api.get(`/shop/common/articles`);
    return response.data;
  }
);

export const fetchCategories = createAsyncThunk(
  "/shop/categories/fetch",
  async () => {
    const response = await api.get(`/shop/common/categories`);
    return response.data;
  }
);

export const joinCommunity = createAsyncThunk(
  "/shop/community/join",
  async (formData) => {
    const response = await api.post(`/shop/common/join-community`, formData);
    return response.data;
  }
);

const shopCommonSlice = createSlice({
  name: "shopCommonSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.articleList = action.payload.data;
      })
      .addCase(fetchArticles.rejected, (state) => {
        state.isLoading = false;
        state.articleList = [];
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoryList = action.payload.data;
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.categoryList = [];
      });
  },
});

export default shopCommonSlice.reducer;
