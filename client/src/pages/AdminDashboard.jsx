import { useEffect, useState, useRef } from "react";
import api from "../services/api";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovieForShows, setSelectedMovieForShows] = useState(null);

  const showsSectionRef = useRef(null);

  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    duration: "",
    language: "",
    posterUrl: "",
    genre: "",
  });

  const [theaterForm, setTheaterForm] = useState({
    name: "",
    location: "",
    address: "",
    amenities: "",
  });

  const [showForm, setShowForm] = useState({
    movieId: "",
    theaterId: "",
    screen: "",
    startTime: "",
    price: "",
  });

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

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
      const res = await api.get(`/shows/movie/${movieId}`);
      setShows(res.data);
    } catch (err) {
      console.error("Failed to fetch shows", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMovies();
    fetchTheaters();
  }, []);

  const addTheater = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const theaterData = {
        name: theaterForm.name,
        location: theaterForm.location,
        address: theaterForm.address,
      };

      if (theaterForm.amenities.trim()) {
        theaterData.amenities = theaterForm.amenities.split(",").map((a) => a.trim());
      }

      await api.post("/theaters", theaterData);
      alert("Theater added successfully");
      setTheaterForm({ name: "", location: "", address: "", amenities: "" });
      fetchTheaters();
      fetchStats();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to add theater";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTheater = async (theaterId, theaterName) => {
    const confirmed = window.confirm(
      `Delete "${theaterName}"?\n\nThis will delete all shows, seats, and cancelled bookings for this theater.\n\nThis action cannot be undone!`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/theaters/${theaterId}`);
      alert("Theater deleted successfully");
      fetchTheaters();
      fetchStats();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete theater";
      alert(message);
    }
  };

  const addMovie = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const movieData = {
        title: movieForm.title,
        description: movieForm.description,
        duration: Number(movieForm.duration),
        language: movieForm.language,
      };

      if (movieForm.posterUrl.trim()) {
        movieData.posterUrl = movieForm.posterUrl.trim();
      }

      if (movieForm.genre.trim()) {
        movieData.genre = movieForm.genre.split(",").map((g) => g.trim());
      }

      await api.post("/movies", movieData);
      alert("Movie added successfully");
      setMovieForm({
        title: "",
        description: "",
        duration: "",
        language: "",
        posterUrl: "",
        genre: "",
      });
      fetchMovies();
      fetchStats();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to add movie";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMovie = async (movieId, movieTitle) => {
    const confirmed = window.confirm(
      `Delete "${movieTitle}"?\n\nThis will delete all shows, seats, and cancelled bookings.\n\nThis action cannot be undone!`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/movies/${movieId}`);
      alert("Movie deleted successfully");
      fetchMovies();
      fetchStats();
      if (selectedMovieForShows === movieId) {
        setSelectedMovieForShows(null);
        setShows([]);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete movie";
      alert(message);
    }
  };

  const addShow = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/shows", {
        movieId: showForm.movieId,
        theaterId: showForm.theaterId,
        screen: showForm.screen,
        startTime: new Date(showForm.startTime).toISOString(),
        price: Number(showForm.price),
      });

      await api.post(`/seats/generate/${res.data._id}`);

      alert("Show created and seats generated successfully");
      setShowForm({
        movieId: "",
        theaterId: "",
        screen: "",
        startTime: "",
        price: "",
      });
      fetchStats();

      if (selectedMovieForShows === showForm.movieId) {
        fetchShows(showForm.movieId);
      }
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Failed to create show";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteShow = async (showId, showDetails) => {
    const confirmed = window.confirm(
      `Delete this show?\n\nTheater: ${showDetails.theater.name}\nScreen: ${showDetails.screen}\nTime: ${new Date(
        showDetails.startTime
      ).toLocaleString()}\n\nThis will delete all seats and cancelled bookings!`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/shows/${showId}`);
      alert("Show deleted successfully");
      fetchStats();
      if (selectedMovieForShows) {
        fetchShows(selectedMovieForShows);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete show";
      alert(message);
    }
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

    // 🎯 This controls how centered it feels
    const offset = (viewportHeight / 2) - (elementHeight / 3);

    window.scrollTo({
      top: elementTop - offset,
      behavior: "smooth",
    });
  }, 100);
};


  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "700", color: "#111827" }}>
          Admin Dashboard
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "15px" }}>
          Manage movies, theaters, and shows
        </p>
      </div>

      {/* ================= ANALYTICS ================= */}
      {stats && (
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>
            Analytics
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Movies
              </div>
              <div style={{ fontSize: "36px", fontWeight: "700", color: "#dc2626" }}>
                {stats.totalMovies || 0}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Theaters
              </div>
              <div style={{ fontSize: "36px", fontWeight: "700", color: "#dc2626" }}>
                {stats.totalTheaters || 0}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Shows
              </div>
              <div style={{ fontSize: "36px", fontWeight: "700", color: "#dc2626" }}>
                {stats.totalShows || 0}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Bookings
              </div>
              <div style={{ fontSize: "36px", fontWeight: "700", color: "#dc2626" }}>
                {stats.totalBookings || 0}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Revenue
              </div>
              <div style={{ fontSize: "36px", fontWeight: "700", color: "#10b981" }}>
                ₹{stats.totalRevenue || 0}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Cancellation Rate
              </div>
              <div style={{ fontSize: "36px", fontWeight: "700", color: "#f59e0b" }}>
                {stats.cancellationRate ? `${stats.cancellationRate}%` : "0%"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD MOVIE FIRST ================= */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>
          Add New Movie
        </h2>
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <form onSubmit={addMovie} style={{ maxWidth: "700px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Movie Title *
              </label>
              <input
                placeholder="Enter movie title"
                value={movieForm.title}
                onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Description
              </label>
              <textarea
                placeholder="Enter movie description"
                value={movieForm.description}
                onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                rows="3"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  placeholder="120"
                  value={movieForm.duration}
                  onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Language *
                </label>
                <input
                  placeholder="English"
                  value={movieForm.language}
                  onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Poster URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/poster.jpg"
                value={movieForm.posterUrl}
                onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Genres (comma separated)
              </label>
              <input
                placeholder="Action, Drama, Thriller"
                value={movieForm.genre}
                onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 32px",
                background: loading ? "#d1d5db" : "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Adding..." : "Add Movie"}
            </button>
          </form>
        </div>
      </div>

      {/* ================= ADD THEATER ================= */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>
          Add New Theater
        </h2>
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <form onSubmit={addTheater} style={{ maxWidth: "700px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Theater Name *
              </label>
              <input
                placeholder="Enter theater name"
                value={theaterForm.name}
                onChange={(e) => setTheaterForm({ ...theaterForm, name: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Location *
              </label>
              <input
                placeholder="Enter city/location"
                value={theaterForm.location}
                onChange={(e) => setTheaterForm({ ...theaterForm, location: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Address
              </label>
              <input
                placeholder="Enter full address"
                value={theaterForm.address}
                onChange={(e) => setTheaterForm({ ...theaterForm, address: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Amenities (comma separated)
              </label>
              <input
                placeholder="e.g., Dolby Atmos, Parking, Food Court"
                value={theaterForm.amenities}
                onChange={(e) => setTheaterForm({ ...theaterForm, amenities: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 32px",
                background: loading ? "#d1d5db" : "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Adding..." : "Add Theater"}
            </button>
          </form>
        </div>
      </div>

      {/* ================= ADD SHOW ================= */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>
          Add New Show
        </h2>
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <form onSubmit={addShow} style={{ maxWidth: "700px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Select Movie *
              </label>
              <select
                value={showForm.movieId}
                onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Choose a movie</option>
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Select Theater *
              </label>
              <select
                value={showForm.theaterId}
                onChange={(e) => setShowForm({ ...showForm, theaterId: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Choose a theater</option>
                {theaters.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} - {t.location}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Screen Name *
                </label>
                <input
                  placeholder="Screen 1, IMAX, etc."
                  value={showForm.screen}
                  onChange={(e) => setShowForm({ ...showForm, screen: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Price (₹) *
                </label>
                <input
                  type="number"
                  placeholder="250"
                  value={showForm.price}
                  onChange={(e) => setShowForm({ ...showForm, price: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Show Time *
              </label>
              <input
                type="datetime-local"
                value={showForm.startTime}
                onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !showForm.movieId || !showForm.theaterId}
              style={{
                padding: "12px 32px",
                background: loading || !showForm.movieId || !showForm.theaterId ? "#d1d5db" : "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading || !showForm.movieId || !showForm.theaterId ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Creating..." : "Create Show & Generate Seats"}
            </button>
          </form>
        </div>
      </div>

      <hr style={{ margin: "48px 0", border: "none", borderTop: "2px solid #e5e7eb" }} />

      {/* ================= EXISTING MOVIES ================= */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>
          Existing Movies ({movies.length})
        </h2>

        {movies.length === 0 ? (
          <div
            style={{
              background: "#f9fafb",
              padding: "40px",
              borderRadius: "12px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            No movies added yet. Add your first movie above.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {movies.map((movie) => (
              <div
                key={movie._id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                    {movie.title}
                  </h3>
                  {movie.description && (
                    <p style={{ margin: "4px 0 12px 0", fontSize: "14px", color: "#6b7280", lineHeight: "1.5" }}>
                      {movie.description}
                    </p>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "13px", color: "#6b7280" }}>
                    {movie.duration && <span>{movie.duration} mins</span>}
                    {movie.language && <span>• {movie.language}</span>}
                    {movie.genre && movie.genre.length > 0 && (
                      <span>• {movie.genre.join(", ")}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                  <button
                    onClick={() => viewShowsForMovie(movie._id)}
                    style={{
                      padding: "8px 16px",
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#fee2e2";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "#fef2f2";
                    }}
                  >
                    View Shows
                  </button>
                  <button
                    onClick={() => deleteMovie(movie._id, movie.title)}
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      color: "#dc2626",
                      border: "1px solid #dc2626",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#dc2626";
                      e.target.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.color = "#dc2626";
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shows Section */}
        {selectedMovieForShows && (
          <div
            ref={showsSectionRef}
            style={{
              background: "#fef2f2",
              padding: "24px",
              borderRadius: "12px",
              marginTop: "24px",
              border: "1px solid #fecaca",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                Shows for: {movies.find((m) => m._id === selectedMovieForShows)?.title}
              </h3>
              <button
                onClick={() => {
                  setSelectedMovieForShows(null);
                  setShows([]);
                }}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Close
              </button>
            </div>

            {shows.length === 0 ? (
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                No shows scheduled for this movie yet.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {shows.map((show) => (
                  <div
                    key={show._id}
                    style={{
                      background: "white",
                      border: "1px solid #fecaca",
                      padding: "16px",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "600", fontSize: "15px", color: "#111827" }}>
                        {show.theater.name}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>
                        {show.theater.location} • {show.screen}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>
                        {new Date(show.startTime).toLocaleString()}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px", color: "#dc2626", fontWeight: "600" }}>
                        ₹{show.price} per seat
                      </p>
                    </div>
                    <button
                      onClick={() => deleteShow(show._id, show)}
                      style={{
                        padding: "8px 16px",
                        background: "transparent",
                        color: "#dc2626",
                        border: "1px solid #dc2626",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#dc2626";
                        e.target.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.color = "#dc2626";
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= EXISTING THEATERS ================= */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#111827" }}>
          Existing Theaters ({theaters.length})
        </h2>

        {theaters.length === 0 ? (
          <div
            style={{
              background: "#f9fafb",
              padding: "40px",
              borderRadius: "12px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            No theaters added yet. Add your first theater above.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {theaters.map((theater) => (
              <div
                key={theater._id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                    {theater.name}
                  </h3>
                  <p style={{ margin: "4px 0", fontSize: "14px", color: "#6b7280" }}>
                    {theater.location}
                    {theater.address && ` • ${theater.address}`}
                  </p>
                  {theater.amenities && theater.amenities.length > 0 && (
                    <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {theater.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "12px",
                            padding: "4px 10px",
                            background: "#f3f4f6",
                            color: "#4b5563",
                            borderRadius: "6px",
                            fontWeight: "500",
                          }}
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteTheater(theater._id, theater.name)}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    color: "#dc2626",
                    border: "1px solid #dc2626",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                    marginLeft: "16px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#dc2626";
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.color = "#dc2626";
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;