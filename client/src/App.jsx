import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Movies from "./pages/Movies";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header / Navigation */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "64px",
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              textDecoration: "none",
              fontSize: "24px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.5px",
            }}
          >
            CineBook
          </Link>

          {user && (
            <nav style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color: location.pathname === "/" ? "#dc2626" : "#6b7280",
                  fontWeight: location.pathname === "/" ? "600" : "500",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: location.pathname === "/" ? "#fef2f2" : "transparent",
                  transition: "all 0.2s",
                  fontSize: "14px",
                }}
              >
                Movies
              </Link>

              <Link
                to="/my-bookings"
                style={{
                  textDecoration: "none",
                  color: location.pathname === "/my-bookings" ? "#dc2626" : "#6b7280",
                  fontWeight: location.pathname === "/my-bookings" ? "600" : "500",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: location.pathname === "/my-bookings" ? "#fef2f2" : "transparent",
                  transition: "all 0.2s",
                  fontSize: "14px",
                }}
              >
                My Bookings
              </Link>

              {user.role === "ADMIN" && (
                <Link
                  to="/admin"
                  style={{
                    textDecoration: "none",
                    color: location.pathname === "/admin" ? "#dc2626" : "#6b7280",
                    fontWeight: location.pathname === "/admin" ? "600" : "500",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: location.pathname === "/admin" ? "#fef2f2" : "transparent",
                    transition: "all 0.2s",
                    fontSize: "14px",
                  }}
                >
                  Admin
                </Link>
              )}

              <div
                style={{
                  height: "24px",
                  width: "1px",
                  background: "#e5e7eb",
                  margin: "0 8px",
                }}
              />

              <span
                style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  padding: "0 8px",
                }}
              >
                {user.role === "ADMIN" ? "Admin" : user.name || "User"}
              </span>

              <button
                onClick={logout}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#dc2626";
                  e.target.style.color = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.color = "#6b7280";
                }}
              >
                Sign Out
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <Routes>
          {/* Auth Routes */}
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/" />}
          />

          {/* User Routes */}
          <Route
            path="/"
            element={user ? <Movies /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-bookings"
            element={user ? <MyBookings /> : <Navigate to="/login" />}
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              user?.role === "ADMIN" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "32px 24px",
          color: "#9ca3af",
          fontSize: "14px",
          borderTop: "1px solid #e5e7eb",
          background: "#fff",
          marginTop: "64px",
        }}
      >
        <p style={{ margin: 0 }}>
          © 2026 CineBook - Movie Reservation System
        </p>
        <p style={{ margin: "8px 0 0 0", fontSize: "12px" }}>
          Designed by Sahil Sonar
        </p>
      </footer>
    </div>
  );
}

export default App;