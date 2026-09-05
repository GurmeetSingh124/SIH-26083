import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { loginUser, registerUser, getMe, updateMyLocation } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("heatsafe_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await getMe();
        setUser(me);
      } catch {
        // token expire ho gaya ya invalid hai
        localStorage.removeItem("heatsafe_token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password });
    localStorage.setItem("heatsafe_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    localStorage.setItem("heatsafe_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("heatsafe_token");
    setToken(null);
    setUser(null);
  }, []);

  const saveLocation = useCallback(async (location) => {
    const updated = await updateMyLocation(location);
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, saveLocation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
