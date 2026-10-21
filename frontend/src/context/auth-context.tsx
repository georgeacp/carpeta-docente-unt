"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiDemoLogin, apiLogin, Usuario } from "@/lib/api";

interface AuthContextType {
  usuario: Usuario | null;
  cargando: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  loginWithDemoAccount: (rol: "docente" | "revisor" | "admin") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("unt_user");
    const savedToken = localStorage.getItem("unt_jwt_token");

    if (savedUser && savedToken) {
      try {
        setUsuario(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("unt_user");
        localStorage.removeItem("unt_jwt_token");
      }
    }

    setCargando(false);
  }, []);

  const redirectByRole = (rol: string) => {
    if (rol === "revisor") {
      router.push("/revisor");
    } else if (rol === "admin") {
      router.push("/admin");
    } else {
      router.push("/docente");
    }
  };

  const loginWithCredentials = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    localStorage.setItem("unt_jwt_token", res.access_token);
    localStorage.setItem("unt_user", JSON.stringify(res.usuario));
    setUsuario(res.usuario);
    redirectByRole(res.usuario.rol);
  };

  const loginWithDemoAccount = async (rol: "docente" | "revisor" | "admin") => {
    const res = await apiDemoLogin(rol);
    localStorage.setItem("unt_jwt_token", res.access_token);
    localStorage.setItem("unt_user", JSON.stringify(res.usuario));
    setUsuario(res.usuario);
    redirectByRole(res.usuario.rol);
  };

  const logout = () => {
    localStorage.removeItem("unt_jwt_token");
    localStorage.removeItem("unt_user");
    setUsuario(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        loginWithCredentials,
        loginWithDemoAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }

  return ctx;
}
