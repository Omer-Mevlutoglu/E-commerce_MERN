import { createContext, useContext } from "react";

interface AuthContextType {
  username: string | null;
  token: string | null;
  isAuthanticated: boolean;
  login: (username: string, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  username: null,
  token: null,
  isAuthanticated: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);
