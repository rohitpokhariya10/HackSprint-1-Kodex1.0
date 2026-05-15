import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../shared/types/api";

interface AuthState {
  user: User | null;
  status: "unknown" | "authenticated" | "unauthenticated";
}

const initialState: AuthState = {
  user: null,
  status: "unknown",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "unauthenticated";
    },
    clearAuth: (state) => {
      state.user = null;
      state.status = "unauthenticated";
    },
    resetAuthCheck: (state) => {
      state.user = null;
      state.status = "unknown";
    },
  },
});

export const { setUser, clearAuth, resetAuthCheck } = authSlice.actions;
export default authSlice.reducer;
