import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../utils/axios";

const initialState = {
  isLoading: false,
  allPagesContent: [],
  currentPageContent: {},
  error: null
};

export const fetchAllPagesContent = createAsyncThunk(
  "/admin/fetchAllPagesContent",
  async () => {
    const response = await api.get("/page-contents");
    return response.data;
  }
);

export const fetchPageContent = createAsyncThunk(
  "/admin/fetchPageContent",
  async (pageSlug) => {
    const response = await api.get(`/page-contents/${pageSlug}`);
    return { pageSlug, data: response.data.data };
  }
);

export const bulkUpsertPageContent = createAsyncThunk(
  "/admin/bulkUpsertPageContent",
  async ({ pageSlug, entries }) => {
    const response = await api.put(`/page-contents/${pageSlug}/bulk`, { entries });
    return response.data;
  }
);

export const deleteCMSContent = createAsyncThunk(
  "/admin/deleteCMSContent",
  async (id) => {
    const response = await api.delete(`/page-contents/${id}`);
    return { id, response: response.data };
  }
);

const adminPageContentsSlice = createSlice({
  name: "adminPageContents",
  initialState,
  reducers: {
    setCurrentPageContent: (state, action) => {
      state.currentPageContent = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPagesContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllPagesContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allPagesContent = action.payload.data;
      })
      .addCase(fetchAllPagesContent.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchPageContent.fulfilled, (state, action) => {
        const contentMap = {};
        action.payload.data.forEach(item => {
          contentMap[item.section_key] = item;
        });
        state.currentPageContent = contentMap;
      });
  },
});

export const { setCurrentPageContent } = adminPageContentsSlice.actions;
export default adminPageContentsSlice.reducer;
