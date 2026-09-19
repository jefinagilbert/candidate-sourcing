import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  activeTab: 'results' | 'filters' | 'rubric' | 'pool';
  filterDrawerOpen: boolean;
  showFreezeModal: boolean;
  viewMode: 'compact' | 'expanded';
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
}

const initialState: UiState = {
  activeTab: 'results',
  filterDrawerOpen: true,
  showFreezeModal: false,
  viewMode: 'expanded',
  toast: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<'results' | 'filters' | 'rubric' | 'pool'>) {
      state.activeTab = action.payload;
    },
    toggleFilterDrawer(state) {
      state.filterDrawerOpen = !state.filterDrawerOpen;
    },
    setShowFreezeModal(state, action: PayloadAction<boolean>) {
      state.showFreezeModal = action.payload;
    },
    setViewMode(state, action: PayloadAction<'compact' | 'expanded'>) {
      state.viewMode = action.payload;
    },
    showToast(
      state,
      action: PayloadAction<{ message: string; type: 'success' | 'info' | 'warning' | 'error' }>
    ) {
      state.toast = action.payload;
    },
    hideToast(state) {
      state.toast = null;
    },
  },
});

export const {
  setActiveTab,
  toggleFilterDrawer,
  setShowFreezeModal,
  setViewMode,
  showToast,
  hideToast,
} = uiSlice.actions;

export default uiSlice.reducer;
