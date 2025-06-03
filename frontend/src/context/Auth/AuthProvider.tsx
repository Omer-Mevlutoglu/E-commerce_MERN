// context/Auth/AuthProvider.tsx
import { FC, PropsWithChildren, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./AuthContext";

const USERNAME_KEY = "username";
const TOKEN_KEY = "token";
const BASE_URL = import.meta.env.VITE_BASE_URL;

// Define the shape of your JWT payload (including role)
interface JWTPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin"; // <— make sure this matches what you put in the token
  iat: number;
  exp: number;
}

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem(USERNAME_KEY)
  );
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myOrders, setMyOrders] = useState<any[]>([]);

  const isAuthenticated = !!token;
  const isAdmin = isAuthenticated && userRole === "admin";

  // Whenever `token` changes (or on first load), decode it to extract `role`
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        setUserRole(decoded.role);
      } catch {
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, [token]);

  const login = (username: string, token: string) => {
    setUsername(username);
    setToken(token);

    localStorage.setItem(USERNAME_KEY, username);
    localStorage.setItem(TOKEN_KEY, token);

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      setUserRole(decoded.role);
    } catch {
      setUserRole(null);
    }
  };

  const logout = () => {
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUsername(null);
    setToken(null);
    setUserRole(null);
  };

  const getMyOrders = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BASE_URL}/users/my-orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Error while getting orders");
      const orders = await response.json();
      setMyOrders(orders);
    } catch (err) {
      console.error(err);
    }
  };

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
