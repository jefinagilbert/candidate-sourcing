import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../../types/sourcing.types';
import { runInitialSearch, runRefinement } from './sourcingSlice';

interface ChatSliceState {
  messages: ChatMessage[];
  isTyping: boolean;
}

const initialWelcomeMessage: ChatMessage = {
  id: 'msg_welcome',
  role: 'assistant',
  content: 'Review the matching candidates on the left. Type feedback here (e.g. "1 is too junior, 2 and 4 are right" or "Include scaleups") to fine-tune the results.',
  timestamp: new Date().toISOString(),
};

const initialState: ChatSliceState = {
  messages: [initialWelcomeMessage],
  isTyping: false,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    clearChat(state) {
      state.messages = [
        {
          ...initialWelcomeMessage,
          timestamp: new Date().toISOString(),
        },
      ];
    },
    setTyping(state, action: PayloadAction<boolean>) {
      state.isTyping = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(runInitialSearch.pending, (state) => {
      state.isTyping = true;
    });
    builder.addCase(runInitialSearch.fulfilled, (state, action) => {
      state.isTyping = false;
      state.messages.push({
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Extracted objective filters and fit rubric for: "${action.payload.query}". Scored talent pool and ranked top matching candidate profiles below. Review them and tell me how to tune the search!`,
        timestamp: new Date().toISOString(),
      });
    });
    builder.addCase(runInitialSearch.rejected, (state, action) => {
      state.isTyping = false;
      state.messages.push({
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Search error: ${action.payload as string}. You can retry or edit filters directly.`,
        timestamp: new Date().toISOString(),
      });
    });

    builder.addCase(runRefinement.pending, (state) => {
      state.isTyping = true;
    });
    builder.addCase(runRefinement.fulfilled, (state, action) => {
      state.isTyping = false;
      state.messages.push({
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: action.payload.explanation,
        timestamp: new Date().toISOString(),
        changes: action.payload.changes,
      });
    });
    builder.addCase(runRefinement.rejected, (state, action) => {
      state.isTyping = false;
      state.messages.push({
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Refinement error: ${action.payload as string}.`,
        timestamp: new Date().toISOString(),
      });
    });
  },
});

export const { addMessage, clearChat, setTyping } = chatSlice.actions;
export default chatSlice.reducer;
