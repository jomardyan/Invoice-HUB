import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: 'en' | 'pl';
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: 'light',
  language: 'pl', // Default to Polish
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'en' | 'pl'>) => {
      state.language = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setTheme, setLanguage } = uiSlice.actions;
export default uiSlice.reducer;
