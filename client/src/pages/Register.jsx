// Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async ({ name, email, password }) => {
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join us to start booking your favourite movies</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <AuthForm
          onSubmit={handleRegister}
          buttonText={loading ? "Creating Account…" : "Create Account"}
          showName
        />

        <p className={styles.footerText}>
          Already have an account?{" "}
          <Link to="/login" className={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;