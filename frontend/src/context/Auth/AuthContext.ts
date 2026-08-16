// context/Auth/AuthContext.tsx
import { createContext, useContext } from "react";
import { Order } from "../../types/Order";

export interface AuthContextType {
  username: string | null;
  token: string | null;
  userRole: "user" | "admin" | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  myOrders: Order[];
  login: (username: string, token: string) => void;
  logout: () => void;
  getMyOrders: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  username: null,
  token: null,
  userRole: null,
  isAuthenticated: false,
  isAdmin: false,
  myOrders: [],
  login: () => {},
  logout: () => {},
  getMyOrders: () => {},
});

export const useAuth = () => useContext(AuthContext);
