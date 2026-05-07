import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  birdDetails: null,
  memberBirds: [],
};

export const registerBird = createAsyncThunk(
  "/birds/registerBird",
  async (formData) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/shop/birds/register`,
      formData
    );
    return response.data;
  }
);

export const getBirdDetails = createAsyncThunk(
  "/birds/getBirdDetails",
  async (id) => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/shop/birds/${id}`
    );
    return response.data;
  }
);

export const getMemberBirds = createAsyncThunk(
  "/birds/getMemberBirds",
  async (memberId) => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/shop/birds/member/${memberId}`
    );
    return response.data;
  }
);

const birdSlice = createSlice({
  name: "birdSlice",
  initialState,
  reducers: {
    setBirdDetails: (state) => {
      state.birdDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBirdDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBirdDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.birdDetails = action.payload.data;
      })
      .addCase(getBirdDetails.rejected, (state) => {
        state.isLoading = false;
        state.birdDetails = null;
      })
      .addCase(getMemberBirds.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMemberBirds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.memberBirds = action.payload.data;
      })
      .addCase(getMemberBirds.rejected, (state) => {
        state.isLoading = false;
        state.memberBirds = [];
      });
  },
});

export const { setBirdDetails } = birdSlice.actions;
export default birdSlice.reducer;
