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

  // Movie form
  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    duration: "",
    language: "",
    posterUrl: "",
    genre: "",
  });

  // ✅ Theater form
  const [theaterForm, setTheaterForm] = useState({
    name: "",
    location: "",
    address: "",
    amenities: "",
  });

  // ✅ Updated Show form - now includes theater
  const [showForm, setShowForm] = useState({
    movieId: "",
    theaterId: "",
    screen: "",
    startTime: "",
    price: "",
  });

  /* ================= FETCH DATA ================= */
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
      // ✅ FIX: Access movies property from response
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

  /* ================= THEATERS ================= */
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
        theaterData.amenities = theaterForm.amenities
          .split(",")
          .map((a) => a.trim());
      }

      await api.post("/theaters", theaterData);
      alert("Theater added successfully");
      setTheaterForm({ name: "", location: "", address: "", amenities: "" });
      fetchTheaters();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to add theater";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTheater = async (theaterId, theaterName) => {
    const confirmed = window.confirm(
      `Delete "${theaterName}"?\n\nThis will delete all shows, seats, and cancelled bookings for this theater.\n\n⚠️ Cannot be undone!`
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

  /* ================= MOVIES ================= */
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
      `Delete "${movieTitle}"?\n\nThis will delete all shows, seats, and cancelled bookings.\n\n⚠️ Cannot be undone!`
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

  /* ================= SHOWS ================= */
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
      ).toLocaleString()}\n\n⚠️ This will delete all seats and cancelled bookings!`
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
      showsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  return (
    <div style={{ maxWidth: "1200px" }}>
      <h2>Admin Dashboard</h2>

      {/* ================= ANALYTICS ================= */}
      {stats && (
        <div style={{ marginBottom: "32px" }}>
          <h3>Analytics</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={{ padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Total Revenue</p>
              <p style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "bold" }}>
                ₹{stats.totalRevenue}
              </p>
            </div>
            <div style={{ padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Total Bookings</p>
              <p style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "bold" }}>
                {stats.totalBookings}
              </p>
            </div>
            <div style={{ padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Cancelled</p>
              <p style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "bold" }}>
                {stats.cancelledBookings}
              </p>
            </div>
            <div style={{ padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Cancel Rate</p>
              <p style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "bold" }}>
                {stats.cancellationRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <hr style={{ margin: "32px 0" }} />

      {/* ================= MANAGE THEATERS ================= */}
      <div style={{ marginBottom: "32px" }}>
        <h3>🎭 Manage Theaters</h3>

        {theaters.length === 0 ? (
          <p style={{ color: "#666" }}>No theaters yet. Add one below!</p>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            {theaters.map((theater) => (
              <div
                key={theater._id}
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 4px 0" }}>🎬 {theater.name}</h4>
                  <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
                    📍 {theater.location}
                    {theater.address && ` - ${theater.address}`}
                  </p>
                  {theater.amenities && theater.amenities.length > 0 && (
                    <p style={{ margin: "4px 0", fontSize: "12px", color: "#999" }}>
                      ✨ {theater.amenities.join(", ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteTheater(theater._id, theater.name)}
                  style={{
                    padding: "8px 16px",
                    background: "#ff4d4f",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <h4>Add New Theater</h4>
        <form onSubmit={addTheater} style={{ maxWidth: "500px" }}>
          <input
            placeholder="Theater Name (e.g., PVR Phoenix Mall) *"
            value={theaterForm.name}
            onChange={(e) => setTheaterForm({ ...theaterForm, name: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            placeholder="City/Location (e.g., Mumbai) *"
            value={theaterForm.location}
            onChange={(e) =>
              setTheaterForm({ ...theaterForm, location: e.target.value })
            }
            required
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            placeholder="Full Address (optional)"
            value={theaterForm.address}
            onChange={(e) =>
              setTheaterForm({ ...theaterForm, address: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            placeholder="Amenities (comma separated: 3D, IMAX, Parking)"
            value={theaterForm.amenities}
            onChange={(e) =>
              setTheaterForm({ ...theaterForm, amenities: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Adding..." : "Add Theater"}
          </button>
        </form>
      </div>

      <hr style={{ margin: "32px 0" }} />

      {/* ================= MANAGE MOVIES ================= */}
      <div style={{ marginBottom: "32px" }}>
        <h3>🎬 Manage Movies</h3>

        {movies.length === 0 ? (
          <p style={{ color: "#666" }}>No movies yet. Add one below!</p>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            {movies.map((movie) => (
              <div
                key={movie._id}
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    style={{
                      width: "80px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "120px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                    }}
                  >
                    🎬
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 4px 0" }}>{movie.title}</h4>
                  <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
                    {movie.duration} mins | {movie.language}
                  </p>
                  {movie.genre && movie.genre.length > 0 && (
                    <p style={{ margin: "4px 0", fontSize: "12px", color: "#999" }}>
                      {movie.genre.join(", ")}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => viewShowsForMovie(movie._id)}
                    style={{
                      padding: "8px 16px",
                      background: "#1890ff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    View Shows
                  </button>
                  <button
                    onClick={() => deleteMovie(movie._id, movie.title)}
                    style={{
                      padding: "8px 16px",
                      background: "#ff4d4f",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SHOWS SECTION */}
        {selectedMovieForShows && (
          <div
            ref={showsSectionRef}
            style={{
              marginBottom: "32px",
              background: "#e6f7ff",
              padding: "20px",
              borderRadius: "8px",
              border: "2px solid #1890ff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0, color: "#0050b3" }}>
                📺 Shows for "{movies.find((m) => m._id === selectedMovieForShows)?.title}"
              </h3>
              <button
                onClick={() => {
                  setSelectedMovieForShows(null);
                  setShows([]);
                }}
                style={{
                  padding: "8px 16px",
                  background: "#ff4d4f",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
            </div>

            {shows.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  background: "white",
                  borderRadius: "4px",
                }}
              >
                <p style={{ color: "#666" }}>No shows yet. Add one below!</p>
              </div>
            ) : (
              shows.map((show) => (
                <div
                  key={show._id}
                  style={{
                    border: "1px solid #91d5ff",
                    padding: "12px",
                    marginBottom: "8px",
                    borderRadius: "4px",
                    background: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "16px" }}>
                      🎭 {show.theater.name}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
                      📍 {show.theater.location} | Screen: {show.screen}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
                      📅 {new Date(show.startTime).toLocaleString()}
                    </p>
                    <p
                      style={{
                        margin: "4px 0",
                        fontSize: "14px",
                        color: "#52c41a",
                        fontWeight: "bold",
                      }}
                    >
                      ₹{show.price} per seat
                    </p>
                  </div>
                  <button
                    onClick={() => deleteShow(show._id, show)}
                    style={{
                      padding: "8px 16px",
                      background: "#ff4d4f",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <h4>Add New Movie</h4>
        <form onSubmit={addMovie} style={{ maxWidth: "500px" }}>
          <input
            placeholder="Title *"
            value={movieForm.title}
            onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <textarea
            placeholder="Description"
            value={movieForm.description}
            onChange={(e) =>
              setMovieForm({ ...movieForm, description: e.target.value })
            }
            rows="3"
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontFamily: "inherit",
            }}
          />
          <input
            type="number"
            placeholder="Duration (minutes) *"
            value={movieForm.duration}
            onChange={(e) =>
              setMovieForm({ ...movieForm, duration: e.target.value })
            }
            required
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            placeholder="Language *"
            value={movieForm.language}
            onChange={(e) =>
              setMovieForm({ ...movieForm, language: e.target.value })
            }
            required
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="url"
            placeholder="Poster URL (optional)"
            value={movieForm.posterUrl}
            onChange={(e) =>
              setMovieForm({ ...movieForm, posterUrl: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            placeholder="Genre (comma separated: Action, Drama)"
            value={movieForm.genre}
            onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Adding..." : "Add Movie"}
          </button>
        </form>
      </div>

      <hr style={{ margin: "32px 0" }} />

      {/* ================= ADD SHOW ================= */}
      <div>
        <h3>➕ Add New Show</h3>
        <form onSubmit={addShow} style={{ maxWidth: "500px" }}>
          <select
            value={showForm.movieId}
            onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Select Movie *</option>
            {movies.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>

          <select
            value={showForm.theaterId}
            onChange={(e) =>
              setShowForm({ ...showForm, theaterId: e.target.value })
            }
            required
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Select Theater *</option>
            {theaters.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} - {t.location}
              </option>
            ))}
          </select>

          <input
            placeholder="Screen (e.g., Screen 1, IMAX)"
            value={showForm.screen}
            onChange={(e) => setShowForm({ ...showForm, screen: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />

          <input
            type="datetime-local"
            value={showForm.startTime}
            onChange={(e) =>
              setShowForm({ ...showForm, startTime: e.target.value })
            }
            required
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />

          <input
            type="number"
            placeholder="Price per seat"
            value={showForm.price}
            onChange={(e) => setShowForm({ ...showForm, price: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />

          <button
            type="submit"
            disabled={loading || !showForm.movieId || !showForm.theaterId}
            style={{
              padding: "10px 20px",
              background: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                loading || !showForm.movieId || !showForm.theaterId
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading ? "Creating..." : "Add Show & Generate Seats"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminDashboard;