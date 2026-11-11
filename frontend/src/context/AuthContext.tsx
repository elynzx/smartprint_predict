import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "../api/client";
import type {
  AuthContextValue,
  AuthSession,
  LoginResponse,
} from "../features/auth/types";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "smartprint.auth";

function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AuthSession) : null;
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isLoading: false,
      login: async (email, password) => {
        const result = await loginRequest(email, password);
        setSession({ token: result.access_token, user: result.user });
        return result.user;
      },
      logout: () => setSession(null),
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }
  return context;
}

export const useAuth = useAuthContext;
