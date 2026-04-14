import { createContext, useEffect, useState } from "react";
import { loginApi } from "../api/authApi";

export const AuthContext = createContext(null);

const AUTH_BOOT_KEY = "localhost_auth_boot_done";

function clearStoredAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("force_password_change");
}

function getInitialAuthState() {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const alreadyBootedInThisTab = sessionStorage.getItem(AUTH_BOOT_KEY) === "1";

  if (isLocalhost && !alreadyBootedInThisTab) {
    clearStoredAuth();
    sessionStorage.setItem(AUTH_BOOT_KEY, "1");
  }

  let parsedUser = null;
  try {
    const raw = localStorage.getItem("user");
    parsedUser = raw ? JSON.parse(raw) : null;
  } catch {
    parsedUser = null;
  }

  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    user: parsedUser,
    forcePasswordChange: localStorage.getItem("force_password_change") === "1",
  };
}

export function AuthProvider({ children }) {
  const [bootState] = useState(() => getInitialAuthState());

  const [token, setToken] = useState(bootState.token);
  const [role, setRole] = useState(bootState.role);
  const [user, setUser] = useState(bootState.user);
  const [forcePasswordChange, setForcePasswordChange] = useState(
    bootState.forcePasswordChange
  );

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
    const data = res.data;

    setToken(data.token || null);
    setRole(data.role || null);
    setUser(data.user || null);
    setForcePasswordChange(!!data.force_password_change);

    return data;
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    setForcePasswordChange(false);
    clearStoredAuth();
  };

  return (
    <AuthContext.Provider
      value={{ token, role, user, forcePasswordChange, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}