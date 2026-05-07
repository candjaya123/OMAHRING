import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../utils/axios";

const initialState = {
  isLoading: false,
  articleList: [],
};

export const addArticle = createAsyncThunk(
  "/admin/addArticle",
  async (formData) => {
    const response = await api.post("/admin/articles/add", formData);
    return response.data;
  }
);

export const fetchAllArticles = createAsyncThunk(
  "/admin/fetchAllArticles",
  async () => {
    const response = await api.get("/admin/articles/get");
    return response.data;
  }
);

export const editArticle = createAsyncThunk(
  "/admin/editArticle",
  async ({ id, formData }) => {
    const response = await api.put(`/admin/articles/edit/${id}`, formData);
    return response.data;
  }
);

export const deleteArticle = createAsyncThunk(
  "/admin/deleteArticle",
  async (id) => {
    const response = await api.delete(`/admin/articles/delete/${id}`);
    return response.data;
  }
);

const adminArticleSlice = createSlice({
  name: "adminArticle",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllArticles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllArticles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.articleList = action.payload.data;
      })
      .addCase(fetchAllArticles.rejected, (state) => {
        state.isLoading = false;
        state.articleList = [];
      });
  },
});

export default adminArticleSlice.reducer;
