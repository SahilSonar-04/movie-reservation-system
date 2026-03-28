// AuthForm.jsx
import { useState } from "react";
import styles from "../pages/Auth.module.css";

function AuthForm({ onSubmit, buttonText, showName }) {
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!minLength) return { valid: false, message: "At least 8 characters" };
    if (!hasUpperCase) return { valid: false, message: "Add an uppercase letter" };
    if (!hasLowerCase) return { valid: false, message: "Add a lowercase letter" };
    if (!hasNumber) return { valid: false, message: "Add a number" };

    let strength = 4;
    if (password.length >= 12) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 4) return { valid: true, strength: "weak" };
    if (strength <= 5) return { valid: true, strength: "medium" };
    return { valid: true, strength: "strong" };
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    if (showName && password) {
      const result = validatePassword(password);
      if (result.valid) {
        setPasswordStrength(result.strength);
        setErrors((prev) => ({ ...prev, password: "" }));
      } else {
        setPasswordStrength("");
        setErrors((prev) => ({ ...prev, password: result.message }));
      }
    } else {
      setPasswordStrength("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = {
      email: form.email.value.toLowerCase().trim(),
      password: form.password.value,
    };
    if (showName) {
      formData.name = form.name.value.trim();
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        setErrors({ password: passwordValidation.message });
        return;
      }
    }
    onSubmit(formData);
  };

  const strengthColor = {
    weak: "#f87171",
    medium: "#f59e0b",
    strong: "#4ade80",
  }[passwordStrength] || "transparent";

  const strengthWidth = {
    weak: "33%",
    medium: "66%",
    strong: "100%",
  }[passwordStrength] || "0%";

  return (
    <form className={styles.form} onSubmit={handleSubmit}>

      {/* Name field — register only */}
      {showName && (
        <div className={styles.fieldWrap}>
          <label className={styles.label}>Full Name</label>
          <input
            name="name"
            placeholder="Sahil Sonar"
            required
            minLength="2"
            maxLength="50"
            className={styles.input}
          />
        </div>
      )}

      {/* Email */}
      <div className={styles.fieldWrap}>
        <label className={styles.label}>Email</label>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className={styles.input}
        />
      </div>

      {/* Password */}
      <div className={styles.fieldWrap}>
        <label className={styles.label}>Password</label>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength="8"
          onChange={handlePasswordChange}
          className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
        />

        {errors.password && (
          <p className={styles.fieldError}>{errors.password}</p>
        )}

        {/* Strength bar — register only */}
        {showName && passwordStrength && (
          <div className={styles.strengthWrap}>
            <div className={styles.strengthBar}>
              <div
                className={styles.strengthFill}
                style={{ width: strengthWidth, background: strengthColor }}
              />
            </div>
            <span className={styles.strengthLabel} style={{ color: strengthColor }}>
              {passwordStrength}
            </span>
          </div>
        )}

        {showName && !passwordStrength && (
          <p className={styles.passwordHint}>
            Uppercase · lowercase · number · min 8 chars
          </p>
        )}
      </div>

      <button type="submit" className={styles.submitBtn}>
        {buttonText}
      </button>
    </form>
  );
}

export default AuthForm;