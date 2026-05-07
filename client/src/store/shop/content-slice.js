import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  contentList: [],
};

export const submitContent = createAsyncThunk(
  "/content/submitContent",
  async (formData) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/shop/common/submit-content`,
      formData
    );
    return response.data;
  }
);

const contentSlice = createSlice({
  name: "contentSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(submitContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(submitContent.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(submitContent.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default contentSlice.reducer;
