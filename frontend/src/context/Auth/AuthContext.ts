import { createContext, useContext } from "react";

interface AuthContextType {
  username: string | null;
  token: string | null;
  login: (username: string, token: string) => void;
  isAuthanticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  username: null,
  token: null,
  login: () => {},
  isAuthanticated: false,
});

export const useAuth = () => useContext(AuthContext);
