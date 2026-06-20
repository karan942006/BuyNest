import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'customer' | 'seller' | 'admin' | 'super_admin' | 'delivery_partner';
  wallet_balance: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialToken = localStorage.getItem('buynest_token');
const initialUser = localStorage.getItem('buynest_user');

const initialState: AuthState = {
  user: initialUser ? JSON.parse(initialUser) : null,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('buynest_token', action.payload.token);
      localStorage.setItem('buynest_user', JSON.stringify(action.payload.user));
    },
    updateProfile(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('buynest_user', JSON.stringify(state.user));
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('buynest_token');
      localStorage.removeItem('buynest_user');
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    }
  }
});

export const { setCredentials, updateProfile, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
