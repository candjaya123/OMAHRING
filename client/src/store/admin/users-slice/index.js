import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../utils/axios";

const initialState = {
  isLoading: false,
  userList: [],
  error: null,
};

// Thunk untuk mengambil semua data pengguna
export const fetchAllUsers = createAsyncThunk(
  "/users/fetchAllUsers",
  async () => {
    const response = await api.get(
      "/admin/users/get"
    );
    return response.data;
  }
);

// Thunk untuk memperbarui peran (role) pengguna
export const updateUserRole = createAsyncThunk(
  "/users/updateUserRole",
  async ({ userId, role }) => {
    const response = await api.put(
      `/admin/users/update-role/${userId}`,
      { role }, // Mengirim peran baru di dalam body request
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  }
);

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All Users
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userList = action.payload.data;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Update User Role
      .addCase(updateUserRole.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserRole.fulfilled, (state) => {
        state.isLoading = false;
        // Tidak perlu mengubah state di sini karena kita akan fetch ulang
        // data pengguna dari komponen untuk memastikan data selalu sinkron.
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export default adminUsersSlice.reducer;