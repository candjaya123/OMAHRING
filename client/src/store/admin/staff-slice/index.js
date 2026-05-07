import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../utils/axios";

const initialState = {
  isLoading: false,
  staffList: [],
  error: null,
};

export const fetchAllStaff = createAsyncThunk(
  "/staff/fetchAllStaff",
  async () => {
    const response = await api.get("/admin/staff/get");
    return response.data;
  }
);

export const addNewStaff = createAsyncThunk(
  "/staff/addNewStaff",
  async (formData) => {
    const response = await api.post("/admin/staff/add", formData);
    return response.data;
  }
);

export const editStaff = createAsyncThunk(
  "/staff/editStaff",
  async ({ id, formData }) => {
    const response = await api.put(`/admin/staff/update/${id}`, formData);
    return response.data;
  }
);

export const deleteStaff = createAsyncThunk(
  "/staff/deleteStaff",
  async (id) => {
    const response = await api.delete(`/admin/staff/delete/${id}`);
    return response.data;
  }
);

const adminStaffSlice = createSlice({
  name: "adminStaff",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStaff.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllStaff.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffList = action.payload.data;
      })
      .addCase(fetchAllStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.staffList = [];
        state.error = action.error.message;
      })
      .addCase(addNewStaff.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addNewStaff.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(addNewStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(editStaff.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(editStaff.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(editStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(deleteStaff.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteStaff.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export default adminStaffSlice.reducer;
