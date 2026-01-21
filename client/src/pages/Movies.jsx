import { useEffect, useState } from "react";
import api from "../services/api";
import MovieCard from "../components/MovieCard";
import Shows from "./Shows";
import Seats from "./Seats";

function Movies() {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const [moviesRes, locationsRes] = await Promise.all([
          api.get("/api/movies"),
          api.get("/api/theaters/locations"),
        ]);
        // ✅ FIX: Access movies property from response
        const moviesData = moviesRes.data.movies || moviesRes.data;
        setMovies(moviesData);
        setFilteredMovies(moviesData);
        setLocations(locationsRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Failed to load movies. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter movies
  useEffect(() => {
    let result = movies;

    // Search by title or description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (movie) =>
          movie.title.toLowerCase().includes(query) ||
          (movie.description && movie.description.toLowerCase().includes(query))
      );
    }

    // Filter by language
    if (selectedLanguage !== "all") {
      result = result.filter(
        (movie) =>
          movie.language &&
          movie.language.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    // Filter by genre
    if (selectedGenre !== "all") {
      result = result.filter(
        (movie) =>
          movie.genre &&
          movie.genre.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
      );
    }

    setFilteredMovies(result);
  }, [searchQuery, selectedLanguage, selectedGenre, movies]);

  const availableLanguages = [
    ...new Set(movies.map((m) => m.language).filter(Boolean)),
  ];

  const availableGenres = [
    ...new Set(movies.flatMap((m) => m.genre || []).filter(Boolean)),
  ];

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLocation("all");
    setSelectedLanguage("all");
    setSelectedGenre("all");
  };

  if (selectedShow) {
    return <Seats show={selectedShow} onBack={() => setSelectedShow(null)} />;
  }

  if (selectedMovie) {
    return (
      <Shows
        movie={selectedMovie}
        selectedLocation={selectedLocation}
        onBack={() => setSelectedMovie(null)}
        onSelectShow={(show) => setSelectedShow(show)}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p>Loading movies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <div
          style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
        <button onClick={() => window.location.reload()} style={{ padding: "8px 16px" }}>
          Retry
        </button>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h2>No Movies Available</h2>
        <p style={{ color: "#666" }}>Check back later for new releases!</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Now Showing</h2>
          <p style={{ color: "#666", margin: "4px 0 0 0" }}>
            {filteredMovies.length} movie{filteredMovies.length !== 1 ? "s" : ""}{" "}
            available
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
          border: "1px solid #e0e0e0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="🔍 Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#999",
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
              background: selectedLocation !== "all" ? "#e6f7ff" : "white",
              fontWeight: selectedLocation !== "all" ? "bold" : "normal",
            }}
          >
            <option value="all">📍 All Cities</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Language */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="all">All Languages</option>
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          {/* Genre */}
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="all">All Genres</option>
            {availableGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>

          {/* Clear */}
          {(searchQuery ||
            selectedLocation !== "all" ||
            selectedLanguage !== "all" ||
            selectedGenre !== "all") && (
            <button
              onClick={clearFilters}
              style={{
                padding: "10px 16px",
                background: "#f5f5f5",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Active Filters */}
        {(searchQuery ||
          selectedLocation !== "all" ||
          selectedLanguage !== "all" ||
          selectedGenre !== "all") && (
          <div style={{ marginTop: "12px", fontSize: "14px", color: "#666" }}>
            <strong>Active:</strong>
            {searchQuery && (
              <span
                style={{
                  marginLeft: "8px",
                  padding: "4px 8px",
                  background: "#e6f7ff",
                  borderRadius: "4px",
                }}
              >
                "{searchQuery}"
              </span>
            )}
            {selectedLocation !== "all" && (
              <span
                style={{
                  marginLeft: "8px",
                  padding: "4px 8px",
                  background: "#fff7e6",
                  borderRadius: "4px",
                }}
              >
                📍 {selectedLocation}
              </span>
            )}
            {selectedLanguage !== "all" && (
              <span
                style={{
                  marginLeft: "8px",
                  padding: "4px 8px",
                  background: "#f6ffed",
                  borderRadius: "4px",
                }}
              >
                {selectedLanguage}
              </span>
            )}
            {selectedGenre !== "all" && (
              <span
                style={{
                  marginLeft: "8px",
                  padding: "4px 8px",
                  background: "#fff0f6",
                  borderRadius: "4px",
                }}
              >
                {selectedGenre}
              </span>
            )}
          </div>
        )}
      </div>

      {/* No Results */}
      {filteredMovies.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#f9f9f9",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0" }}>No movies found</h3>
          <p style={{ color: "#666", marginBottom: "16px" }}>
            Try adjusting your filters
          </p>
          <button
            onClick={clearFilters}
            style={{
              padding: "10px 20px",
              background: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        /* Movies Grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              onSelect={() => setSelectedMovie(movie)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Movies;