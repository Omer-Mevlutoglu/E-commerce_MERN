// context/Auth/AuthProvider.tsx
import { FC, PropsWithChildren, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./AuthContext";
import { api, configureApiClient } from "../../api/client";
import { Order } from "../../types/Order";

const USERNAME_KEY = "username";
const TOKEN_KEY = "token";

// Define the shape of your JWT payload (including role)
interface JWTPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  iat: number;
  exp: number;
}

/** Rejects a token that is missing, malformed, or already past its expiry. */
const decodeToken = (token: string | null): JWTPayload | null => {
  if (!token) return null;

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    if (decoded.exp * 1000 <= Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
};

/**
 * A token already past its expiry is dropped on load, so the app never starts
 * in a signed-in state it cannot act on.
 */
const readStoredToken = (): string | null => {
  const stored = localStorage.getItem(TOKEN_KEY);

  if (stored && !decodeToken(stored)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    return null;
  }

  return stored;
};

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY) ? localStorage.getItem(USERNAME_KEY) : null
  );
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(
    () => decodeToken(readStoredToken())?.role ?? null
  );
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  const isAuthenticated = !!token;
  const isAdmin = isAuthenticated && userRole === "admin";

  const logout = useCallback(() => {
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUsername(null);
    setToken(null);
    setUserRole(null);
    setMyOrders([]);
  }, []);

  // Whenever `token` changes (or on first load), decode it to extract `role`
  useEffect(() => {
    setUserRole(decodeToken(token)?.role ?? null);
  }, [token]);

  // Give the API client a way to read the current token and to end the session
  // when the server rejects it. Registered rather than imported, so the client
  // does not have to depend on this provider.
  useEffect(() => {
    configureApiClient({
      getToken: () => token,
      onUnauthorized: logout,
    });
  }, [token, logout]);

  const login = (username: string, token: string) => {
    setUsername(username);
    setToken(token);
    setUserRole(decodeToken(token)?.role ?? null);

    localStorage.setItem(USERNAME_KEY, username);
    localStorage.setItem(TOKEN_KEY, token);
  };

  const getMyOrders = useCallback(async () => {
    if (!token) return;
    try {
      setMyOrders(await api.get<Order[]>("/orders"));
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        username,
        token,
        userRole,
        isAuthenticated,
        isAdmin,
        myOrders,
        login,
        logout,
        getMyOrders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
