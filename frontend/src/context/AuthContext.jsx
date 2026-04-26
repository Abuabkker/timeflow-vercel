import { createContext, useContext, useState, useEffect } from "react";
import { Auth } from "../utils/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tf_token");
    const saved = localStorage.getItem("tf_user");
    if (token && saved) {
      setUser(JSON.parse(saved));
      Auth.me()
        .then(r => { setUser(r.data.user); localStorage.setItem("tf_user", JSON.stringify(r.data.user)); })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  async function login(userId, pin) {
    const { data } = await Auth.login(userId, pin);
    localStorage.setItem("tf_token", data.token);
    localStorage.setItem("tf_user",  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("tf_token");
    localStorage.removeItem("tf_user");
    setUser(null);
  }

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
