// Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async ({ email, password }) => {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        <div className={styles.header}>
          <span className={styles.logo}>
            CINE<span className={styles.logoAccent}>BOOK</span>
          </span>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue booking movies</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <AuthForm
          onSubmit={handleLogin}
          buttonText={loading ? "Signing In…" : "Sign In"}
        />

        <p className={styles.footerText}>
          Don't have an account?{" "}
          <Link to="/register" className={styles.footerLink}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;