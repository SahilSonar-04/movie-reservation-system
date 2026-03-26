import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from token on page load/refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        const decoded = jwtDecode(token);

        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        } else {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      const userData = res.data.user;
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      const userData = res.data.user;
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      console.error("Registration failed:", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // ✅ Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};