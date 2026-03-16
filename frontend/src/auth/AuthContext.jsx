import { createContext, useEffect, useState } from "react";
import { loginApi } from "../api/authApi";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [forcePasswordChange, setForcePasswordChange] = useState(
    localStorage.getItem("force_password_change") === "1"
  );

  // keep localStorage in sync
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (role) localStorage.setItem("role", role);
    else localStorage.removeItem("role");
  }, [role]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    localStorage.setItem("force_password_change", forcePasswordChange ? "1" : "0");
  }, [forcePasswordChange]);

  const login = async ({ email, password }) => {
    const res = await loginApi({ email, password });

    // backend should return: token, role, user, force_password_change
    const data = res.data;

    setToken(data.token || null);
    setRole(data.role || null);
    setUser(data.user || null);
    setForcePasswordChange(!!data.force_password_change);

    return data; // IMPORTANT: return data to SignIn page
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    setForcePasswordChange(false);

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("force_password_change");
  };

  return (
    <AuthContext.Provider
      value={{ token, role, user, forcePasswordChange, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
