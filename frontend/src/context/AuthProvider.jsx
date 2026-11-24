import { useEffect, useState } from "react";

import { AuthContext } from "./authContext";

import { loginUser, registerUser, fetchCurrentUser } from "../api/auth.api";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      const token = localStorage.getItem("triagesync_token");

      try {
        if (token) {
          const data = await fetchCurrentUser();

          if (active) {
            setUser(data.user);
          }
        }
      } catch {
        if (active) {
          localStorage.removeItem("triagesync_token");
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    function handleExpired() {
      setUser(null);
    }

    window.addEventListener("auth:expired", handleExpired);

    initializeAuth();

    return () => {
      active = false;

      window.removeEventListener("auth:expired", handleExpired);
    };
  }, []);

  async function login(credentials) {
    const data = await loginUser(credentials);

    localStorage.setItem("triagesync_token", data.token);

    setUser(data.user);

    return data.user;
  }

  async function register(userData) {
    return registerUser(userData);
  }

  function logout() {
    localStorage.removeItem("triagesync_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAdmin: user?.role === "ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
