"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie'; // Importe a biblioteca

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Leia o token do cookie quando o componente carregar
    const storedToken = Cookies.get("authToken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    // Salve o token no cookie. Ele expirará em 7 dias.
    Cookies.set("authToken", newToken, { expires: 7 });
    router.push("/");
  };

  const logout = () => {
    setToken(null);
    // Remova o token do cookie
    Cookies.remove("authToken");
    router.push("/login");
  };

  const authContextValue = {
    isAuthenticated: !!token,
    token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};