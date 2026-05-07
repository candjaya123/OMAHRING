import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  sessionId: null,
  messages: [],
  sessions: [], // for admin
};

export const startChatSession = createAsyncThunk(
  "/chat/startChatSession",
  async (customer_id) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/shop/chat/start`,
      { customer_id }
    );
    return response.data;
  }
);

export const sendMessage = createAsyncThunk(
  "/chat/sendMessage",
  async (messageData) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/shop/chat/message`,
      messageData
    );
    return response.data;
  }
);

export const getChatMessages = createAsyncThunk(
  "/chat/getChatMessages",
  async (sessionId) => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/shop/chat/messages/${sessionId}`
    );
    return response.data;
  }
);

const chatSlice = createSlice({
  name: "chatSlice",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setSessionId: (state, action) => {
        state.sessionId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(startChatSession.fulfilled, (state, action) => {
        state.sessionId = action.payload.data.id;
      })
      .addCase(getChatMessages.fulfilled, (state, action) => {
        state.messages = action.payload.data;
      });
  },
});

export const { addMessage, setSessionId } = chatSlice.actions;
export default chatSlice.reducer;
