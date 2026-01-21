import { useState } from "react";

function AuthForm({ onSubmit, buttonText, showName }) {
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!minLength) {
      return { valid: false, message: "Password must be at least 8 characters" };
    }
    if (!hasUpperCase) {
      return {
        valid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }
    if (!hasLowerCase) {
      return {
        valid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }
    if (!hasNumber) {
      return { valid: false, message: "Password must contain at least one number" };
    }

    // Calculate strength
    let strength = 0;
    if (minLength) strength++;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumber) strength++;
    if (password.length >= 12) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++; // Special char

    if (strength <= 3) return { valid: true, strength: "weak" };
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

      // Validate password on submit
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        setErrors({ password: passwordValidation.message });
        return;
      }
    }

    onSubmit(formData);
  };

  const getStrengthColor = () => {
    if (passwordStrength === "weak") return "#ff4d4f";
    if (passwordStrength === "medium") return "#faad14";
    if (passwordStrength === "strong") return "#52c41a";
    return "#e0e0e0";
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      {showName && (
        <input
          name="name"
          placeholder="Full Name"
          required
          minLength="2"
          maxLength="50"
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
      )}

      <input
        name="email"
        type="email"
        placeholder="Email Address"
        required
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "12px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          fontSize: "14px",
        }}
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        minLength="8"
        onChange={handlePasswordChange}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: errors.password ? "4px" : "16px",
          border: `1px solid ${errors.password ? "#ff4d4f" : "#ddd"}`,
          borderRadius: "4px",
          fontSize: "14px",
        }}
      />

      {errors.password && (
        <div
          style={{
            color: "#ff4d4f",
            fontSize: "12px",
            marginBottom: "8px",
            marginTop: "-8px",
          }}
        >
          {errors.password}
        </div>
      )}

      {showName && passwordStrength && (
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              height: "4px",
              background: "#e0e0e0",
              borderRadius: "2px",
              overflow: "hidden",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                height: "100%",
                width:
                  passwordStrength === "weak"
                    ? "33%"
                    : passwordStrength === "medium"
                    ? "66%"
                    : "100%",
                background: getStrengthColor(),
                transition: "all 0.3s",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "11px",
              color: getStrengthColor(),
              textTransform: "capitalize",
            }}
          >
            Password Strength: {passwordStrength}
          </div>
        </div>
      )}

      {showName && (
        <div
          style={{
            fontSize: "11px",
            color: "#666",
            marginBottom: "12px",
            lineHeight: "1.4",
          }}
        >
          Password must contain: uppercase, lowercase, number (min 8 characters)
        </div>
      )}

      <button
        type="submit"
        style={{
          width: "100%",
          padding: "12px",
          background: "#1890ff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.background = "#0050b3")}
        onMouseLeave={(e) => (e.target.style.background = "#1890ff")}
      >
        {buttonText}
      </button>
    </form>
  );
}

export default AuthForm;