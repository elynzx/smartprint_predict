import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest, type AuthUser } from "../api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "smartprint.auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{
    token: string;
    user: AuthUser;
  } | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? (JSON.parse(saved) as { token: string; user: AuthUser })
      : null;
  });

  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return context;
}
