import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Movies from "./pages/Movies";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./context/AuthContext";
import styles from "./App.module.css";

function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  return (
    <div className={styles.shell}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            CINE<span className={styles.logoAccent}>BOOK</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span
              className={`${styles.hamburger} ${
                mobileMenuOpen ? styles.hamburgerActive : ""
              }`}
            />
          </button>

          {/* Mobile Backdrop */}
          <div
            className={`${styles.navBackdrop} ${
              mobileMenuOpen ? styles.navBackdropOpen : ""
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Nav */}
          <nav
            className={`${styles.nav} ${
              mobileMenuOpen ? styles.navOpen : ""
            }`}
          >
            <Link
              to="/"
              className={`${styles.navLink} ${
                isActive("/") && location.pathname === "/"
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              Movies
            </Link>

            {user ? (
              <>
                <Link
                  to="/my-bookings"
                  className={`${styles.navLink} ${
                    isActive("/my-bookings") ? styles.navLinkActive : ""
                  }`}
                >
                  My Bookings
                </Link>

                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className={`${styles.navLink} ${
                      isActive("/admin") ? styles.navLinkActive : ""
                    }`}
                  >
                    Admin
                  </Link>
                )}

                <div className={styles.navDivider} />

                <span className={styles.userName}>
                  {user.role === "ADMIN" ? "Admin" : user.name || "User"}
                </span>

                <button className={styles.signOutBtn} onClick={logout}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`${styles.signInBtn} ${
                    isActive("/login") ? styles.navLinkActive : ""
                  }`}
                >
                  Sign In
                </Link>
                <Link to="/register" className={styles.signUpBtn}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main className={styles.main}>
        <Routes>
          <Route path="/login"    element={!user ? <Login />    : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/"         element={<Movies />} />
          <Route path="/my-bookings" element={user ? <MyBookings /> : <Navigate to="/login" />} />
          <Route
            path="/admin"
            element={user?.role === "ADMIN" ? <AdminDashboard /> : <Navigate to="/" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>© 2026 CineBook — Movie Reservation System</p>
        <p className={styles.footerSub}>Designed by Sahil Sonar</p>
      </footer>

    </div>
  );
}

export default App;