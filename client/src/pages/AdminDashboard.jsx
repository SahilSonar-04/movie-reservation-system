import { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";
import styles from "./AdminDashboard.module.css";

/* ── Toast ──────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${type === "error" ? styles.toastError : styles.toastSuccess}`}>
      <span className={styles.toastMsg}>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>×</button>
    </div>
  );
}

/* ── Confirm dialog ─────────────────────────────────────── */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.dialogBackdrop}>
      <div className={styles.dialog}>
        <p className={styles.dialogMsg}>{message}</p>
        <div className={styles.dialogActions}>
          <button className={styles.dialogCancel} onClick={onCancel}>Cancel</button>
          <button className={styles.dialogDelete} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── SpinIcon ───────────────────────────────────────────── */
function RefreshIcon({ spinning }) {
  return (
    <svg
      width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      className={spinning ? styles.spinning : ""}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

/* ── Main component ─────────────────────────────────────── */
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
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

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await api.get("/admin/sync-status");
      setSyncStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch sync status", err);
    }
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await api.get("/movies?includeAll=true");
      setMovies(res.data.movies || res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTheaters = async () => {
    try {
      const res = await api.get("/theaters");
      setTheaters(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchShows = async (movieId) => {
    try {
      const res = await api.get(`/shows/movie/${movieId}?includePast=true`);
      setShows(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchStats();
    fetchSyncStatus();
    fetchMovies();
    fetchTheaters();
    autoRefreshIntervalRef.current = setInterval(() => {
      fetchStats(true);
      fetchSyncStatus();
    }, 30000);
    return () => clearInterval(autoRefreshIntervalRef.current);
  }, [fetchStats, fetchSyncStatus]);

  const handleManualRefresh = async () => {
    setStatsRefreshing(true);
    await Promise.all([fetchStats(), fetchSyncStatus(), fetchMovies(), fetchTheaters()]);
    setStatsRefreshing(false);
    showToast("Dashboard refreshed");
  };

  /* ── TMDB Sync ──────────────────────────────────────────── */
  const handleTMDBSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post("/admin/sync-movies");
      const { moviesCreated, moviesUpdated, showsCreated, duplicatesMerged, moviesRemoved } = res.data;
      showToast(
        `Sync complete — ${moviesCreated} created, ${moviesUpdated || 0} updated, ${showsCreated} shows created` +
        (duplicatesMerged ? `, ${duplicatesMerged} duplicates merged` : "") +
        (moviesRemoved ? `, ${moviesRemoved} stale removed` : "")
      );
      fetchMovies(); fetchTheaters(); fetchStats(); fetchSyncStatus();
    } catch (err) {
      showToast(err.response?.data?.message || "TMDB sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  /* ── Stale Movie & Duplicate Cleanup ───────────────────── */
  const handleCleanupMovies = () => {
    showConfirm(
      "Clean up stale movies & duplicates?\n\nThis will remove movies with no upcoming shows (and their past unbooked shows/seats), merge duplicate movies, and clean up expired seat records.\n\nPast completed bookings will be preserved.",
      async () => {
        closeConfirm();
        setCleaning(true);
        try {
          const res = await api.post("/admin/cleanup-movies");
          const { moviesRemoved, duplicatesMerged, showsCleaned } = res.data;
          showToast(
            `Cleanup complete — ${moviesRemoved} stale movies removed, ${duplicatesMerged || 0} duplicates merged, ${showsCleaned || 0} old shows cleaned`
          );
          fetchMovies(); fetchStats(); fetchSyncStatus();
        } catch (err) {
          showToast(err.response?.data?.message || "Cleanup failed", "error");
        } finally {
          setCleaning(false);
        }
      }
    );
  };

  /* ── CRUD ────────────────────────────────────────────────── */
  const addMovie = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { title: movieForm.title, description: movieForm.description, duration: Number(movieForm.duration), language: movieForm.language };
      if (movieForm.posterUrl.trim()) data.posterUrl = movieForm.posterUrl.trim();
      if (movieForm.genre.trim())     data.genre = movieForm.genre.split(",").map((g) => g.trim());
      await api.post("/movies", data);
      showToast("Movie added successfully");
      setMovieForm({ title: "", description: "", duration: "", language: "", posterUrl: "", genre: "" });
      fetchMovies(); fetchStats();
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
          fetchMovies(); fetchStats();
          if (selectedMovieForShows === movieId) { setSelectedMovieForShows(null); setShows([]); }
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to delete movie", "error");
        }
      }
    );
  };

  const addTheater = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { name: theaterForm.name, location: theaterForm.location, address: theaterForm.address };
      if (theaterForm.amenities.trim()) data.amenities = theaterForm.amenities.split(",").map((a) => a.trim());
      await api.post("/theaters", data);
      showToast("Theater added successfully");
      setTheaterForm({ name: "", location: "", address: "", amenities: "" });
      fetchTheaters(); fetchStats();
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
          fetchTheaters(); fetchStats();
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to delete theater", "error");
        }
      }
    );
  };

  const addShow = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/shows", {
        movieId: showForm.movieId, theaterId: showForm.theaterId,
        screen: showForm.screen, startTime: new Date(showForm.startTime).toISOString(), price: Number(showForm.price),
      });
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
      window.scrollTo({ top: rect.top + window.pageYOffset - window.innerHeight / 3, behavior: "smooth" });
    }, 100);
  };

  /* ── Analytics stat rows ─────────────────────────────────── */
  const statRows = stats ? [
    { label: "Total Movies",       value: stats.totalMovies   || 0,                             cls: styles.statRed   },
    { label: "Total Theaters",     value: stats.totalTheaters || 0,                             cls: styles.statRed   },
    { label: "Total Shows",        value: stats.totalShows    || 0,                             cls: styles.statRed   },
    { label: "Total Bookings",     value: stats.totalBookings || 0,                             cls: styles.statRed   },
    { label: "Total Revenue",      value: `₹${stats.totalRevenue || 0}`,                        cls: styles.statGreen },
    { label: "Cancellation Rate",  value: stats.cancellationRate ? `${stats.cancellationRate}%` : "0%", cls: styles.statAmber },
  ] : [];

  return (
    <div className={styles.page}>
      {toast   && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={closeConfirm} />}

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>Manage movies, theaters, and shows</p>
        </div>
        <div className={styles.headerActions}>
          {lastRefreshed && (
            <span className={styles.lastRefreshed}>
              Refreshed {lastRefreshed.toLocaleTimeString()}
            </span>
          )}

          <button
            className={styles.cleanupBtn}
            onClick={handleCleanupMovies}
            disabled={cleaning || syncing}
            title="Clean up movies with no upcoming shows and merge duplicate movies"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              className={cleaning ? styles.spinning : ""}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {cleaning ? "Cleaning…" : "Clean Up Stale Movies"}
          </button>

          <button
            className={styles.syncBtn}
            onClick={handleTMDBSync}
            disabled={syncing || cleaning}
            title="Fetch now-playing movies from TMDB and auto-generate shows"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              className={syncing ? styles.spinning : ""}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            {syncing ? "Syncing…" : "Fetch latest movies"}
          </button>

          <button className={styles.refreshBtn} onClick={handleManualRefresh} disabled={statsRefreshing}>
            <RefreshIcon spinning={statsRefreshing} />
            {statsRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Auto-Sync & Maintenance Status ── */}
      {syncStatus && (
        <div className={styles.maintenanceBanner}>
          <div className={styles.maintenanceInfo}>
            <div className={`${styles.statusIndicator} ${syncStatus.isRunning ? styles.statusIndicatorSyncing : ""}`}>
              <span className={styles.statusDot} />
              {syncStatus.isRunning ? "Auto-Sync Running" : "Auto-Sync Active"}
            </div>
            <div className={styles.maintenanceDetails}>
              <div className={styles.maintenanceDetailItem}>
                <span>Interval:</span>
                <span className={styles.maintenanceDetailValue}>Every {syncStatus.intervalHours || 12} hours</span>
              </div>
              {syncStatus.nextSyncTime && (
                <div className={styles.maintenanceDetailItem}>
                  <span>Next Auto-Sync:</span>
                  <span className={styles.maintenanceDetailValue}>
                    {new Date(syncStatus.nextSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {syncStatus.lastSyncTime && (
                <div className={styles.maintenanceDetailItem}>
                  <span>Last Sync:</span>
                  <span className={styles.maintenanceDetailValue}>
                    {new Date(syncStatus.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics ── */}
      {stats && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Analytics</h2>
          <div className={styles.statsGrid}>
            {statRows.map(({ label, value, cls }) => (
              <div key={label} className={styles.statCard}>
                <div className={styles.statLabel}>{label}</div>
                <div className={`${styles.statValue} ${cls}`}>{value}</div>
              </div>
            ))}
          </div>
          <p className={styles.statsNote}>Auto-refreshes every 30 seconds</p>
        </div>
      )}

      {/* ── Add Movie ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Add New Movie</h2>
        <div className={styles.formCard}>
          <form onSubmit={addMovie} className={styles.form}>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Movie Title *</label>
              <input className={styles.input} placeholder="Enter movie title" value={movieForm.title}
                onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })} required />
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Description</label>
              <textarea className={styles.input} placeholder="Enter movie description" value={movieForm.description}
                onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                rows={3} style={{ resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div className={styles.inputGrid2}>
              <div>
                <label className={styles.label}>Duration (minutes) *</label>
                <input className={styles.input} type="number" placeholder="120" value={movieForm.duration}
                  onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })} required />
              </div>
              <div>
                <label className={styles.label}>Language *</label>
                <input className={styles.input} placeholder="English" value={movieForm.language}
                  onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })} required />
              </div>
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Poster URL</label>
              <input className={styles.input} type="url" placeholder="https://example.com/poster.jpg"
                value={movieForm.posterUrl}
                onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })} />
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Genres (comma separated)</label>
              <input className={styles.input} placeholder="Action, Drama, Thriller" value={movieForm.genre}
                onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Adding…" : "Add Movie"}
            </button>
          </form>
        </div>
      </div>

      {/* ── Add Theater ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Add New Theater</h2>
        <div className={styles.formCard}>
          <form onSubmit={addTheater} className={styles.form}>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Theater Name *</label>
              <input className={styles.input} placeholder="Enter theater name" value={theaterForm.name}
                onChange={(e) => setTheaterForm({ ...theaterForm, name: e.target.value })} required />
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Location *</label>
              <input className={styles.input} placeholder="Enter city/location" value={theaterForm.location}
                onChange={(e) => setTheaterForm({ ...theaterForm, location: e.target.value })} required />
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Address</label>
              <input className={styles.input} placeholder="Enter full address" value={theaterForm.address}
                onChange={(e) => setTheaterForm({ ...theaterForm, address: e.target.value })} />
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Amenities (comma separated)</label>
              <input className={styles.input} placeholder="Dolby Atmos, Parking, Food Court" value={theaterForm.amenities}
                onChange={(e) => setTheaterForm({ ...theaterForm, amenities: e.target.value })} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Adding…" : "Add Theater"}
            </button>
          </form>
        </div>
      </div>

      {/* ── Add Show ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Add New Show</h2>
        <div className={styles.formCard}>
          <form onSubmit={addShow} className={styles.form}>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Select Movie *</label>
              <select className={styles.input} style={{ cursor: "pointer" }}
                value={showForm.movieId}
                onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })} required>
                <option value="">Choose a movie</option>
                {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Select Theater *</label>
              <select className={styles.input} style={{ cursor: "pointer" }}
                value={showForm.theaterId}
                onChange={(e) => setShowForm({ ...showForm, theaterId: e.target.value })} required>
                <option value="">Choose a theater</option>
                {theaters.map((t) => <option key={t._id} value={t._id}>{t.name} — {t.location}</option>)}
              </select>
            </div>
            <div className={styles.inputGrid2_1}>
              <div>
                <label className={styles.label}>Screen Name *</label>
                <input className={styles.input} placeholder="Screen 1, IMAX…" value={showForm.screen}
                  onChange={(e) => setShowForm({ ...showForm, screen: e.target.value })} required />
              </div>
              <div>
                <label className={styles.label}>Price (₹) *</label>
                <input className={styles.input} type="number" placeholder="250" value={showForm.price}
                  onChange={(e) => setShowForm({ ...showForm, price: e.target.value })} required />
              </div>
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Seat Layout</label>
              <div className={styles.inputGridSeat}>
                <div>
                  <label className={`${styles.label} ${styles.labelSmall}`}>Rows (1–10)</label>
                  <input className={styles.input} type="number" min="1" max="10" value={showForm.rows}
                    onChange={(e) => setShowForm({ ...showForm, rows: e.target.value })} required />
                </div>
                <div>
                  <label className={`${styles.label} ${styles.labelSmall}`}>Seats per Row (1–20)</label>
                  <input className={styles.input} type="number" min="1" max="20" value={showForm.seatsPerRow}
                    onChange={(e) => setShowForm({ ...showForm, seatsPerRow: e.target.value })} required />
                </div>
              </div>
              <p className={styles.seatNote}>
                Total seats: {(Number(showForm.rows) || 0) * (Number(showForm.seatsPerRow) || 0)}
              </p>
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Show Time *</label>
              <input className={styles.input} type="datetime-local" value={showForm.startTime}
                onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })} required />
            </div>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !showForm.movieId || !showForm.theaterId}
            >
              {loading ? "Creating…" : "Create Show & Generate Seats"}
            </button>
          </form>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Existing Movies ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Existing Movies ({movies.length})</h2>

        {movies.length === 0 ? (
          <div className={styles.entityEmpty}>
            No movies added yet. Use "Fetch latest movies" to auto-import now-playing movies.
          </div>
        ) : (
          <div className={styles.entityList}>
            {movies.map((movie) => (
              <div key={movie._id} className={styles.entityCard}>
                <div className={styles.entityMain}>
                  {movie.posterUrl && (
                    <img src={movie.posterUrl} alt={movie.title} className={styles.entityPoster} />
                  )}
                  <div className={styles.entityInfo}>
                    <h3 className={styles.entityName}>{movie.title}</h3>
                    {movie.description && (
                      <p className={styles.entityDesc}>
                        {movie.description.slice(0, 120)}{movie.description.length > 120 ? "…" : ""}
                      </p>
                    )}
                    <div className={styles.entityMeta}>
                      {movie.duration && <span className={styles.entityMetaItem}>{movie.duration} mins</span>}
                      {movie.language && <span className={styles.entityMetaItem}>· {movie.language}</span>}
                      {movie.genre?.length > 0 && <span className={styles.entityMetaItem}>· {movie.genre.join(", ")}</span>}
                      {movie.upcomingShowsCount > 0 ? (
                        <span className={styles.showCountBadge}>
                          ✓ {movie.upcomingShowsCount} upcoming {movie.upcomingShowsCount === 1 ? "show" : "shows"}
                        </span>
                      ) : (
                        <span className={styles.staleShowBadge}>
                          ⚠ No upcoming shows
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.entityActions}>
                  <button className={styles.viewShowsBtn} onClick={() => viewShowsForMovie(movie._id)}>
                    View Shows
                  </button>
                  <button className={styles.deleteBtn} onClick={() => deleteMovie(movie._id, movie.title)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shows panel */}
        {selectedMovieForShows && (
          <div className={styles.showsPanel} ref={showsSectionRef}>
            <div className={styles.showsPanelHeader}>
              <h3 className={styles.showsPanelTitle}>
                Shows for: {movies.find((m) => m._id === selectedMovieForShows)?.title}
              </h3>
              <button className={styles.showsPanelClose} onClick={() => { setSelectedMovieForShows(null); setShows([]); }}>
                Close
              </button>
            </div>

            {shows.length === 0 ? (
              <p className={styles.showsPanelEmpty}>No shows scheduled for this movie yet.</p>
            ) : (
              <div className={styles.showsList}>
                {shows.map((show) => (
                  <div key={show._id} className={styles.showItem}>
                    <div className={styles.showItemInfo}>
                      <p className={styles.showItemTheater}>{show.theater.name}</p>
                      <p className={styles.showItemMeta}>{show.theater.location} · {show.screen}</p>
                      <p className={styles.showItemMeta}>{new Date(show.startTime).toLocaleString()}</p>
                      <p className={styles.showItemPrice}>₹{show.price} / seat</p>
                    </div>
                    <button className={styles.deleteBtn} onClick={() => deleteShow(show._id, show)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Existing Theaters ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Existing Theaters ({theaters.length})</h2>

        {theaters.length === 0 ? (
          <div className={styles.entityEmpty}>No theaters added yet.</div>
        ) : (
          <div className={styles.entityList}>
            {theaters.map((theater) => (
              <div key={theater._id} className={styles.entityCard}>
                <div className={styles.entityMain}>
                  <div className={styles.entityInfo}>
                    <h3 className={styles.entityName}>{theater.name}</h3>
                    <p className={styles.entityDesc}>
                      {theater.location}{theater.address && ` · ${theater.address}`}
                    </p>
                    {theater.amenities?.length > 0 && (
                      <div className={styles.amenities}>
                        {theater.amenities.map((a, i) => (
                          <span key={i} className={styles.amenityTag}>{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.entityActions}>
                  <button className={styles.deleteBtn} onClick={() => deleteTheater(theater._id, theater.name)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;