import type { PropsWithChildren } from "react";
import { createContext, useContext, useState } from "react";

import { fetchMe, loginUser, registerUser } from "../api/client";
import type { ApiUser } from "../types/api";

type SignUpPayload = {
  full_name: string;
  city: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  token: string | null;
  user: ApiUser | null;
  isSubmitting: boolean;
  signIn: (payload: { email: string; password: string }) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signIn: AuthContextValue["signIn"] = async (payload) => {
    setIsSubmitting(true);
    try {
      const result = await loginUser(payload);
      setToken(result.access_token);
      setUser(result.user);
    } finally {
      setIsSubmitting(false);
    }
  };

  const signUp: AuthContextValue["signUp"] = async (payload) => {
    setIsSubmitting(true);
    try {
      const result = await registerUser(payload);
      setToken(result.access_token);
      setUser(result.user);
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    const me = await fetchMe(token);
    setUser(me);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isSubmitting,
        signIn,
        signUp,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
