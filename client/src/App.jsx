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
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Header / Navigation */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          padding: "16px 24px",
          marginBottom: "24px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "24px", color: "#333" }}>
            🎬 Movie Reservation System
          </h1>

          {user && (
            <nav style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color: location.pathname === "/" ? "#1890ff" : "#666",
                  fontWeight: location.pathname === "/" ? "bold" : "normal",
                  padding: "8px 12px",
                }}
              >
                Movies
              </Link>

              <Link
                to="/my-bookings"
                style={{
                  textDecoration: "none",
                  color: location.pathname === "/my-bookings" ? "#1890ff" : "#666",
                  fontWeight: location.pathname === "/my-bookings" ? "bold" : "normal",
                  padding: "8px 12px",
                }}
              >
                My Bookings
              </Link>

              {user.role === "ADMIN" && (
                <Link
                  to="/admin"
                  style={{
                    textDecoration: "none",
                    color: location.pathname === "/admin" ? "#1890ff" : "#666",
                    fontWeight: location.pathname === "/admin" ? "bold" : "normal",
                    padding: "8px 12px",
                  }}
                >
                  Admin Dashboard
                </Link>
              )}

              <span
                style={{
                  color: "#999",
                  fontSize: "14px",
                  marginLeft: "8px",
                }}
              >
                {user.role === "ADMIN" ? "👑 Admin" : "👤 User"}
              </span>

              <button
                onClick={logout}
                style={{
                  padding: "8px 16px",
                  background: "#ff4d4f",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginLeft: "8px",
                }}
              >
                Logout
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px 40px",
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
          padding: "20px",
          color: "#999",
          fontSize: "14px",
          borderTop: "1px solid #e0e0e0",
          background: "#fff",
        }}
      >
        <p style={{ margin: 0 }}>
          Movie Reservation System - Sahil Sonar
        </p>
      </footer>
    </div>
  );
}

export default App;