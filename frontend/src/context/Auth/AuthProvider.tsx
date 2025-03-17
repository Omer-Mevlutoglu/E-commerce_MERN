import { FC, PropsWithChildren, useState } from "react";
import { AuthContext } from "./AuthContext";
const USERNAME_KEY = "username";
const TOKEN_KEY = "token";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem(USERNAME_KEY)
  );

  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );
  const [myOrders, setMyOrders] = useState([]);
  const isAuthanticated = !!token;

  const login = (username: string, token: string) => {
    setUsername(username);
    setToken(token);

    localStorage.setItem(USERNAME_KEY, username);
    localStorage.setItem(TOKEN_KEY, token);
  };

  const logout = () => {
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUsername(null);
    setToken(null);
  };
  const getMyOrders = async () => {
    const response = await fetch(`${BASE_URL}/users/my-orders`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Error while getting orders");
    }

    const orders = await response.json();
    setMyOrders(orders);
  };
  return (
    <AuthContext.Provider
      value={{ username, token, isAuthanticated, login, myOrders,logout, getMyOrders }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
