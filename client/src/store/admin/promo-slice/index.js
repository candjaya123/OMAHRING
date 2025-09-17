import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../utils/axios";

const initialState = {
  isLoading: false,
  promoList: [],
  error: null,
};

export const fetchAllPromos = createAsyncThunk(
  "/promos/fetchAllPromos",
  async () => {
    const response = await api.get(
      "/admin/promos/get"
    );
    return response.data;
  }
);

export const addNewPromo = createAsyncThunk(
  "/promos/addNewPromo",
  async (formData) => {
    const response = await api.post(
      "/admin/promos/add",
      formData,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  }
);

export const updatePromo = createAsyncThunk(
  "/promos/updatePromo",
  async ({ id, formData }) => {
    const response = await api.put(
      `/admin/promos/update/${id}`,
      formData,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  }
);

const adminPromosSlice = createSlice({
  name: "adminPromos",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 🔹 SEMUA .addCase DITEMPATKAN DI ATAS 🔹
      .addCase(fetchAllPromos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.promoList = action.payload.data;
      })
      .addCase(addNewPromo.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updatePromo.fulfilled, (state) => {
        state.isLoading = false;
      })
      // 🔹 SEMUA .addMatcher DITEMPATKAN DI BAWAH 🔹
      .addMatcher(
        (action) => action.type.startsWith("/promos/") && action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("/promos/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.isLoading = false;
          state.error = action.error.message;
        }
      );
  },
});

export default adminPromosSlice.reducer;