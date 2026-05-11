import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../utils/axios";

const initialState = {
  isLoading: false,
  sessionId: null,
  sessionContext: null,   // { type, id, title, url } — set at session creation
  messages: [],
  allSessions: [],
  unreadCount: 0,
};

export const startChatSession = createAsyncThunk(
  "/chat/startChatSession",
  async ({ customer_id, session_token, context } = {}) => {
    const payload = { customer_id, session_token };

    // Only attach context if it's a meaningful type (not general)
    if (context?.type && context.type !== 'general') {
      payload.context = context;
    }

    const response = await api.post(
      `/chat/start`,
      payload
    );
    return response.data;
  }
);

export const sendMessage = createAsyncThunk(
  "/chat/sendMessage",
  async (messageData) => {
    const response = await api.post(
      `/chat/message`,
      messageData
    );
    return response.data;
  }
);

export const getChatMessages = createAsyncThunk(
  "/chat/getChatMessages",
  async (sessionId) => {
    const response = await api.get(
      `/chat/messages/${sessionId}`
    );
    return response.data;
  }
);

export const getAllSessions = createAsyncThunk(
  "/chat/getAllSessions",
  async () => {
    const response = await api.get(
      `/chat/sessions`
    );
    return response.data;
  }
);

export const adminReplyMessage = createAsyncThunk(
  "/chat/adminReplyMessage",
  async (replyData) => {
    const response = await api.post(
      `/chat/reply`,
      replyData
    );
    return response.data;
  }
);

export const closeSession = createAsyncThunk(
  "/chat/closeSession",
  async (sessionId) => {
    const response = await api.put(
      `/chat/session/${sessionId}/close`
    );
    return response.data;
  }
);

export const getUnreadCount = createAsyncThunk(
  "/chat/getUnreadCount",
  async () => {
    const response = await api.get(
      `/chat/unread-count`
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
    setChatContext: (state, action) => {
      state.sessionContext = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startChatSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(startChatSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.data?.sessionId || action.payload.data?.id;
        state.sessionContext = action.payload.data?.context || null;
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

export const { addMessage, setSessionId, setChatContext } = chatSlice.actions;
export default chatSlice.reducer;
