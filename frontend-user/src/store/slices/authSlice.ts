import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User, Tenant } from '../../types';

const initialState: AuthState = {
  user: null,
  tenant: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{
        user: User;
        tenant: Tenant;
        accessToken: string;
        refreshToken?: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.tenant = action.payload.tenant;
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.isAuthenticated = true;
      state.isLoading = false;

      // Store in localStorage
      localStorage.setItem('accessToken', action.payload.accessToken);
      if (action.payload.refreshToken) {
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      }
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.tenant = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setAuth, updateAccessToken, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
