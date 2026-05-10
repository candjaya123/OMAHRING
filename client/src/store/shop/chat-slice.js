import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../utils/axios";

const initialState = {
  isLoading: false,
  sessionId: null,
  messages: [],
  allSessions: [], // for admin/manager
  unreadCount: 0,
};

export const startChatSession = createAsyncThunk(
  "/chat/startChatSession",
  async (customer_id) => {
    const response = await api.post(
      `/shop/chat/start`,
      { customer_id }
    );
    return response.data;
  }
);

export const sendMessage = createAsyncThunk(
  "/chat/sendMessage",
  async (messageData) => {
    const response = await api.post(
      `/shop/chat/message`,
      messageData
    );
    return response.data;
  }
);

export const getChatMessages = createAsyncThunk(
  "/chat/getChatMessages",
  async (sessionId) => {
    const response = await api.get(
      `/shop/chat/messages/${sessionId}`
    );
    return response.data;
  }
);

export const getAllSessions = createAsyncThunk(
  "/chat/getAllSessions",
  async () => {
    const response = await api.get(
      `/shop/chat/sessions`
    );
    return response.data;
  }
);

export const adminReplyMessage = createAsyncThunk(
  "/chat/adminReplyMessage",
  async (replyData) => {
    const response = await api.post(
      `/shop/chat/reply`,
      replyData
    );
    return response.data;
  }
);

export const closeSession = createAsyncThunk(
  "/chat/closeSession",
  async (sessionId) => {
    const response = await api.put(
      `/shop/chat/session/${sessionId}/close`
    );
    return response.data;
  }
);

export const getUnreadCount = createAsyncThunk(
  "/chat/getUnreadCount",
  async () => {
    const response = await api.get(
      `/shop/chat/unread-count`
    );
    return response.data;
  }
);

const chatSlice = createSlice({
  name: "chatSlice",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const exists = state.messages.find(m => m.id === action.payload.id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startChatSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(startChatSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.data.id;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        if (action.payload?.data) {
          const exists = state.messages.find(m => m.id === action.payload.data.id);
          if (!exists) {
            state.messages.push(action.payload.data);
          }
        }
      })
      .addCase(getChatMessages.fulfilled, (state, action) => {
        state.messages = action.payload.data;
      })
      .addCase(getAllSessions.fulfilled, (state, action) => {
        state.allSessions = action.payload.data;
      })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.totalUnread;
      });
  },
});

export const { addMessage, setSessionId } = chatSlice.actions;
export default chatSlice.reducer;
