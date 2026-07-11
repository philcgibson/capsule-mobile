import * as SecureStore from "expo-secure-store";
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type AuthToken,
  type CurrentUser,
  getCurrentUser,
  getTestUserToken,
  deleteAccount,
  login,
  logout,
  register,
} from "@/lib/api";

const tokenStorageKey = "capsule.mobileToken";

type AuthInput = {
  email: string;
  password: string;
};

type RegisterInput = AuthInput & {
  name: string;
  passwordConfirmation: string;
};

type SessionContextValue = {
  bootstrapping: boolean;
  token: string | null;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  signIn: (input: AuthInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  useDemoSession: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteMyAccount: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);
let fallbackToken: string | null = null;

export function SessionProvider({ children }: PropsWithChildren) {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const applyAuth = useCallback(async (auth: AuthToken) => {
    await writeToken(auth.token);
    setToken(auth.token);
    setUser(auth.user);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const storedToken = await readToken();

        if (!storedToken) {
          if (
            __DEV__ &&
            process.env.EXPO_PUBLIC_AUTO_DEMO_OWNER === "true"
          ) {
            const response = await getTestUserToken();
            await writeToken(response.data.token);

            if (!cancelled) {
              setToken(response.data.token);
              setUser(response.data.user);
            }
          }

          return;
        }

        const response = await getCurrentUser(storedToken);

        if (!cancelled) {
          setToken(storedToken);
          setUser(response.data);
        }
      } catch {
        await deleteToken();

        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (input: AuthInput) => {
      const response = await login(input);
      await applyAuth(response.data);
    },
    [applyAuth],
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      const response = await register(input);
      await applyAuth(response.data);
    },
    [applyAuth],
  );

  const useDemoSession = useCallback(async () => {
    const response = await getTestUserToken();
    await applyAuth(response.data);
  }, [applyAuth]);

  const signOut = useCallback(async () => {
    const currentToken = token;

    setToken(null);
    setUser(null);
    await deleteToken();

    if (currentToken) {
      await logout(currentToken).catch(() => undefined);
    }
  }, [token]);

  const deleteMyAccount = useCallback(async (password: string) => {
    if (!token) {
      return;
    }

    await deleteAccount(token, password);
    setToken(null);
    setUser(null);
    await deleteToken();
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }

    const response = await getCurrentUser(token);
    setUser(response.data);
  }, [token]);

  const value = useMemo(
    () => ({
      bootstrapping,
      token,
      user,
      isAuthenticated: Boolean(token && user),
      signIn,
      signUp,
      useDemoSession,
      signOut,
      deleteMyAccount,
      refreshUser,
    }),
    [
      bootstrapping,
      refreshUser,
      signIn,
      signOut,
      deleteMyAccount,
      signUp,
      token,
      useDemoSession,
      user,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = use(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider.");
  }

  return context;
}

async function readToken() {
  if (await canUseSecureStore()) {
    return SecureStore.getItemAsync(tokenStorageKey);
  }

  return fallbackToken;
}

async function writeToken(nextToken: string) {
  fallbackToken = nextToken;

  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(tokenStorageKey, nextToken);
  }
}

async function deleteToken() {
  fallbackToken = null;

  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(tokenStorageKey);
  }
}

async function canUseSecureStore() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}
