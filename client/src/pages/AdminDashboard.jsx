import { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, background: c.bg, border: `1px solid ${c.border}`, color: c.text, padding: "14px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "500", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxWidth: "360px", display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.text, fontSize: "18px", lineHeight: 1, padding: 0 }}>×</button>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: "12px", padding: "28px", maxWidth: "420px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <p style={{ margin: "0 0 24px 0", fontSize: "15px", color: "#111827", lineHeight: "1.6", whiteSpace: "pre-line" }}>{message}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "9px 20px", background: "transparent", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: "#6b7280" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "9px 20px", background: "#dc2626", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#fff" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [selectedMovieForShows, setSelectedMovieForShows] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const showsSectionRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);

  const showToast = (message, type = "success") => setToast({ message, type });
  const showConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  const [movieForm, setMovieForm] = useState({ title: "", description: "", duration: "", language: "", posterUrl: "", genre: "" });
  const [theaterForm, setTheaterForm] = useState({ name: "", location: "", address: "", amenities: "" });
  const [showForm, setShowForm] = useState({ movieId: "", theaterId: "", screen: "", startTime: "", price: "", rows: "5", seatsPerRow: "10" });

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setStatsRefreshing(true);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      if (!silent) setStatsRefreshing(false);
    }
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await api.get("/movies");
      setMovies(res.data.movies || res.data);
    } catch (err) {
      console.error("Failed to fetch movies", err);
    }
  };

  const fetchTheaters = async () => {
    try {
      const res = await api.get("/theaters");
      setTheaters(res.data);
    } catch (err) {
      console.error("Failed to fetch theaters", err);
    }
  };

  const fetchShows = async (movieId) => {
    try {
      const res = await api.get(`/shows/movie/${movieId}?includePast=true`);
      setShows(res.data);
    } catch (err) {
      console.error("Failed to fetch shows", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMovies();
    fetchTheaters();

    autoRefreshIntervalRef.current = setInterval(() => {
      fetchStats(true);
    }, 30000);

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [fetchStats]);

  const handleManualRefresh = async () => {
    setStatsRefreshing(true);
    await fetchStats();
    await fetchMovies();
    await fetchTheaters();
    setStatsRefreshing(false);
    showToast("Dashboard refreshed");
  };

  // ─── TMDB Sync ────────────────────────────────────────────────────────────
  const handleTMDBSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post("/admin/sync-movies");
      const { moviesCreated, moviesSkipped, showsCreated } = res.data;
      showToast(
        `Sync complete — ${moviesCreated} new movies, ${showsCreated} shows created, ${moviesSkipped} already existed`
      );
      fetchMovies();
      fetchTheaters();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "TMDB sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const addTheater = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const theaterData = { name: theaterForm.name, location: theaterForm.location, address: theaterForm.address };
      if (theaterForm.amenities.trim()) theaterData.amenities = theaterForm.amenities.split(",").map((a) => a.trim());
      await api.post("/theaters", theaterData);
      showToast("Theater added successfully");
      setTheaterForm({ name: "", location: "", address: "", amenities: "" });
      fetchTheaters();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add theater", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteTheater = (theaterId, theaterName) => {
    showConfirm(
      `Delete "${theaterName}"?\n\nThis will delete all shows, seats, and cancelled bookings for this theater.\n\nThis action cannot be undone.`,
      async () => {
        closeConfirm();
        try {
          await api.delete(`/theaters/${theaterId}`);
          showToast("Theater deleted successfully");
          fetchTheaters();
          fetchStats();
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to delete theater", "error");
        }
      }
    );
  };

  const addMovie = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const movieData = { title: movieForm.title, description: movieForm.description, duration: Number(movieForm.duration), language: movieForm.language };
      if (movieForm.posterUrl.trim()) movieData.posterUrl = movieForm.posterUrl.trim();
      if (movieForm.genre.trim()) movieData.genre = movieForm.genre.split(",").map((g) => g.trim());
      await api.post("/movies", movieData);
      showToast("Movie added successfully");
      setMovieForm({ title: "", description: "", duration: "", language: "", posterUrl: "", genre: "" });
      fetchMovies();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add movie", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteMovie = (movieId, movieTitle) => {
    showConfirm(
      `Delete "${movieTitle}"?\n\nThis will delete all shows, seats, and cancelled bookings.\n\nThis action cannot be undone.`,
      async () => {
        closeConfirm();
        try {
          await api.delete(`/movies/${movieId}`);
          showToast("Movie deleted successfully");
          fetchMovies();
          fetchStats();
          if (selectedMovieForShows === movieId) { setSelectedMovieForShows(null); setShows([]); }
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to delete movie", "error");
        }
      }
    );
  };

  const addShow = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/shows", { movieId: showForm.movieId, theaterId: showForm.theaterId, screen: showForm.screen, startTime: new Date(showForm.startTime).toISOString(), price: Number(showForm.price) });
      await api.post(`/seats/generate/${res.data._id}`, { rows: Number(showForm.rows), seatsPerRow: Number(showForm.seatsPerRow) });
      showToast("Show created and seats generated successfully");
      setShowForm({ movieId: "", theaterId: "", screen: "", startTime: "", price: "", rows: "5", seatsPerRow: "10" });
      fetchStats();
      if (selectedMovieForShows === showForm.movieId) fetchShows(showForm.movieId);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create show", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteShow = (showId, showDetails) => {
    const timeStr = new Date(showDetails.startTime).toLocaleString();
    showConfirm(
      `Delete this show?\n\nTheater: ${showDetails.theater.name}\nScreen: ${showDetails.screen}\nTime: ${timeStr}\n\nThis will delete all seats and cancelled bookings.`,
      async () => {
        closeConfirm();
        try {
          await api.delete(`/shows/${showId}`);
          showToast("Show deleted successfully");
          fetchStats();
          if (selectedMovieForShows) fetchShows(selectedMovieForShows);
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to delete show", "error");
        }
      }
    );
  };

  const viewShowsForMovie = (movieId) => {
    setSelectedMovieForShows(movieId);
    fetchShows(movieId);
    setTimeout(() => {
      if (!showsSectionRef.current) return;
      const rect = showsSectionRef.current.getBoundingClientRect();
      const elementTop = rect.top + window.pageYOffset;
      const elementHeight = rect.height;
      const viewportHeight = window.innerHeight;
      const offset = (viewportHeight / 2) - (elementHeight / 3);
      window.scrollTo({ top: elementTop - offset, behavior: "smooth" });
    }, 100);
  };

  const inputStyle = { width: "100%", padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" };

  return (
    <div style={{ maxWidth: "1200px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={closeConfirm} />}

      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "700", color: "#111827" }}>Admin Dashboard</h1>
          <p style={{ color: "#6b7280", margin: 0, fontSize: "15px" }}>Manage movies, theaters, and shows</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {lastRefreshed && (
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}

          {/* TMDB Sync Button */}
          <button
            onClick={handleTMDBSync}
            disabled={syncing}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px",
              background: syncing ? "#f3f4f6" : "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              cursor: syncing ? "not-allowed" : "pointer",
              fontSize: "13px", fontWeight: "600",
              color: syncing ? "#9ca3af" : "#dc2626",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { if (!syncing) { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = syncing ? "#f3f4f6" : "#fef2f2"; e.currentTarget.style.color = syncing ? "#9ca3af" : "#dc2626"; }}
            title="Fetch now-playing movies from TMDB and auto-generate shows for next 7 days"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ animation: syncing ? "spin 1s linear infinite" : "none" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            {syncing ? "Syncing..." : "Sync from TMDB"}
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={statsRefreshing}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px",
              background: statsRefreshing ? "#f3f4f6" : "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              cursor: statsRefreshing ? "not-allowed" : "pointer",
              fontSize: "13px", fontWeight: "500",
              color: statsRefreshing ? "#9ca3af" : "#374151",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { if (!statsRefreshing) { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = statsRefreshing ? "#9ca3af" : "#374151"; }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ animation: statsRefreshing ? "spin 1s linear infinite" : "none" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {statsRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Analytics */}
      {stats && (
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>Analytics</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {[
              { label: "Total Movies", value: stats.totalMovies || 0, color: "#dc2626" },
              { label: "Total Theaters", value: stats.totalTheaters || 0, color: "#dc2626" },
              { label: "Total Shows", value: stats.totalShows || 0, color: "#dc2626" },
              { label: "Total Bookings", value: stats.totalBookings || 0, color: "#dc2626" },
              { label: "Total Revenue", value: `₹${stats.totalRevenue || 0}`, color: "#10b981" },
              { label: "Cancellation Rate", value: stats.cancellationRate ? `${stats.cancellationRate}%` : "0%", color: "#f59e0b" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                <div style={{ fontSize: "36px", fontWeight: "700", color }}>{value}</div>
              </div>
            ))}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#9ca3af" }}>Auto-refreshes every 30 seconds</p>
        </div>
      )}

      {/* Add Movie */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>Add New Movie</h2>
        <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
          <form onSubmit={addMovie} style={{ maxWidth: "700px" }}>
            <div style={{ marginBottom: "16px" }}><label style={labelStyle}>Movie Title *</label><input placeholder="Enter movie title" value={movieForm.title} onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })} required style={inputStyle} /></div>
            <div style={{ marginBottom: "16px" }}><label style={labelStyle}>Description</label><textarea placeholder="Enter movie description" value={movieForm.description} onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })} rows="3" style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div><label style={labelStyle}>Duration (minutes) *</label><input type="number" placeholder="120" value={movieForm.duration} onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })} required style={inputStyle} /></div>
              <div><label style={labelStyle}>Language *</label><input placeholder="English" value={movieForm.language} onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })} required style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: "16px" }}><label style={labelStyle}>Poster URL</label><input type="url" placeholder="https://example.com/poster.jpg" value={movieForm.posterUrl} onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })} style={inputStyle} /></div>
            <div style={{ marginBottom: "20px" }}><label style={labelStyle}>Genres (comma separated)</label><input placeholder="Action, Drama, Thriller" value={movieForm.genre} onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })} style={inputStyle} /></div>
            <button type="submit" disabled={loading} style={{ padding: "12px 32px", background: loading ? "#d1d5db" : "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", fontSize: "15px", fontWeight: "600" }}>{loading ? "Adding..." : "Add Movie"}</button>
          </form>
        </div>
      </div>

      {/* Add Theater */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>Add New Theater</h2>
        <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
          <form onSubmit={addTheater} style={{ maxWidth: "700px" }}>
            <div style={{ marginBottom: "16px" }}><label style={labelStyle}>Theater Name *</label><input placeholder="Enter theater name" value={theaterForm.name} onChange={(e) => setTheaterForm({ ...theaterForm, name: e.target.value })} required style={inputStyle} /></div>
            <div style={{ marginBottom: "16px" }}><label style={labelStyle}>Location *</label><input placeholder="Enter city/location" value={theaterForm.location} onChange={(e) => setTheaterForm({ ...theaterForm, location: e.target.value })} required style={inputStyle} /></div>
            <div style={{ marginBottom: "16px" }}><label style={labelStyle}>Address</label><input placeholder="Enter full address" value={theaterForm.address} onChange={(e) => setTheaterForm({ ...theaterForm, address: e.target.value })} style={inputStyle} /></div>
            <div style={{ marginBottom: "20px" }}><label style={labelStyle}>Amenities (comma separated)</label><input placeholder="Dolby Atmos, Parking, Food Court" value={theaterForm.amenities} onChange={(e) => setTheaterForm({ ...theaterForm, amenities: e.target.value })} style={inputStyle} /></div>
            <button type="submit" disabled={loading} style={{ padding: "12px 32px", background: loading ? "#d1d5db" : "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", fontSize: "15px", fontWeight: "600" }}>{loading ? "Adding..." : "Add Theater"}</button>
          </form>
        </div>
      </div>

      {/* Add Show */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>Add New Show</h2>
        <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
          <form onSubmit={addShow} style={{ maxWidth: "700px" }}>
            <div style={{ marginBottom: "16px" }}><label style={labelStyle}>Select Movie *</label><select value={showForm.movieId} onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })} required style={{ ...inputStyle, cursor: "pointer" }}><option value="">Choose a movie</option>{movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}</select></div>
            <div style={{ marginBottom: "16px" }}><label style={labelStyle}>Select Theater *</label><select value={showForm.theaterId} onChange={(e) => setShowForm({ ...showForm, theaterId: e.target.value })} required style={{ ...inputStyle, cursor: "pointer" }}><option value="">Choose a theater</option>{theaters.map((t) => <option key={t._id} value={t._id}>{t.name} - {t.location}</option>)}</select></div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div><label style={labelStyle}>Screen Name *</label><input placeholder="Screen 1, IMAX, etc." value={showForm.screen} onChange={(e) => setShowForm({ ...showForm, screen: e.target.value })} required style={inputStyle} /></div>
              <div><label style={labelStyle}>Price (₹) *</label><input type="number" placeholder="250" value={showForm.price} onChange={(e) => setShowForm({ ...showForm, price: e.target.value })} required style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Seat Layout</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div><label style={{ ...labelStyle, fontSize: "12px", color: "#6b7280" }}>Rows (1–10)</label><input type="number" min="1" max="10" placeholder="5" value={showForm.rows} onChange={(e) => setShowForm({ ...showForm, rows: e.target.value })} required style={inputStyle} /></div>
                <div><label style={{ ...labelStyle, fontSize: "12px", color: "#6b7280" }}>Seats per Row (1–20)</label><input type="number" min="1" max="20" placeholder="10" value={showForm.seatsPerRow} onChange={(e) => setShowForm({ ...showForm, seatsPerRow: e.target.value })} required style={inputStyle} /></div>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#9ca3af" }}>Total seats: {(Number(showForm.rows) || 0) * (Number(showForm.seatsPerRow) || 0)}</p>
            </div>
            <div style={{ marginBottom: "20px" }}><label style={labelStyle}>Show Time *</label><input type="datetime-local" value={showForm.startTime} onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })} required style={inputStyle} /></div>
            <button type="submit" disabled={loading || !showForm.movieId || !showForm.theaterId} style={{ padding: "12px 32px", background: loading || !showForm.movieId || !showForm.theaterId ? "#d1d5db" : "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: loading || !showForm.movieId || !showForm.theaterId ? "not-allowed" : "pointer", fontSize: "15px", fontWeight: "600" }}>{loading ? "Creating..." : "Create Show & Generate Seats"}</button>
          </form>
        </div>
      </div>

      <hr style={{ margin: "48px 0", border: "none", borderTop: "2px solid #e5e7eb" }} />

      {/* Existing Movies */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>Existing Movies ({movies.length})</h2>
        {movies.length === 0 ? (
          <div style={{ background: "#f9fafb", padding: "40px", borderRadius: "12px", textAlign: "center", color: "#6b7280" }}>No movies added yet. Use "Sync from TMDB" to auto-import now-playing movies.</div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {movies.map((movie) => (
              <div key={movie._id} style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  {movie.posterUrl && (
                    <img src={movie.posterUrl} alt={movie.title} style={{ width: "48px", height: "72px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
                  )}
                  <div>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#111827" }}>{movie.title}</h3>
                    {movie.description && <p style={{ margin: "4px 0 12px 0", fontSize: "14px", color: "#6b7280", lineHeight: "1.5" }}>{movie.description.slice(0, 120)}{movie.description.length > 120 ? "..." : ""}</p>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "13px", color: "#6b7280" }}>
                      {movie.duration && <span>{movie.duration} mins</span>}
                      {movie.language && <span>• {movie.language}</span>}
                      {movie.genre && movie.genre.length > 0 && <span>• {movie.genre.join(", ")}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                  <button onClick={() => viewShowsForMovie(movie._id)} style={{ padding: "8px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", whiteSpace: "nowrap" }}>View Shows</button>
                  <button onClick={() => deleteMovie(movie._id, movie.title)} style={{ padding: "8px 16px", background: "transparent", color: "#dc2626", border: "1px solid #dc2626", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedMovieForShows && (
          <div ref={showsSectionRef} style={{ background: "#fef2f2", padding: "24px", borderRadius: "12px", marginTop: "24px", border: "1px solid #fecaca" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#111827" }}>Shows for: {movies.find((m) => m._id === selectedMovieForShows)?.title}</h3>
              <button onClick={() => { setSelectedMovieForShows(null); setShows([]); }} style={{ padding: "6px 12px", background: "transparent", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Close</button>
            </div>
            {shows.length === 0 ? (
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>No shows scheduled for this movie yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {shows.map((show) => (
                  <div key={show._id} style={{ background: "white", border: "1px solid #fecaca", padding: "16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "600", fontSize: "15px", color: "#111827" }}>{show.theater.name}</p>
                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>{show.theater.location} • {show.screen}</p>
                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>{new Date(show.startTime).toLocaleString()}</p>
                      <p style={{ margin: "4px 0", fontSize: "14px", color: "#dc2626", fontWeight: "600" }}>₹{show.price} per seat</p>
                    </div>
                    <button onClick={() => deleteShow(show._id, show)} style={{ padding: "8px 16px", background: "transparent", color: "#dc2626", border: "1px solid #dc2626", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Existing Theaters */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>Existing Theaters ({theaters.length})</h2>
        {theaters.length === 0 ? (
          <div style={{ background: "#f9fafb", padding: "40px", borderRadius: "12px", textAlign: "center", color: "#6b7280" }}>No theaters added yet.</div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {theaters.map((theater) => (
              <div key={theater._id} style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#111827" }}>{theater.name}</h3>
                  <p style={{ margin: "4px 0", fontSize: "14px", color: "#6b7280" }}>{theater.location}{theater.address && ` • ${theater.address}`}</p>
                  {theater.amenities && theater.amenities.length > 0 && (
                    <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {theater.amenities.map((amenity, idx) => (<span key={idx} style={{ fontSize: "12px", padding: "4px 10px", background: "#f3f4f6", color: "#4b5563", borderRadius: "6px", fontWeight: "500" }}>{amenity}</span>))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteTheater(theater._id, theater.name)} style={{ padding: "8px 16px", background: "transparent", color: "#dc2626", border: "1px solid #dc2626", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", marginLeft: "16px" }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default AdminDashboard;