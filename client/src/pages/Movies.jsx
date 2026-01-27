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
          api.get("/movies"),
          api.get("/theaters/locations"),
        ]);
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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (movie) =>
          movie.title.toLowerCase().includes(query) ||
          (movie.description && movie.description.toLowerCase().includes(query))
      );
    }

    if (selectedLanguage !== "all") {
      result = result.filter(
        (movie) =>
          movie.language &&
          movie.language.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

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
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #f3f4f6",
            borderTopColor: "#dc2626",
            borderRadius: "50%",
            margin: "0 auto 12px",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading movies...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "600px", margin: "80px auto", padding: "0 20px" }}>
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2 style={{ color: "#111827", marginBottom: "8px" }}>No Movies Available</h2>
        <p style={{ color: "#6b7280" }}>Check back later for new releases!</p>
      </div>
    );
  }

  const activeFiltersCount = [
    searchQuery,
    selectedLocation !== "all",
    selectedLanguage !== "all",
    selectedGenre !== "all",
  ].filter(Boolean).length;

  return (
    <div>
      {/* Header - More compact */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: "700", color: "#111827" }}>
          Now Showing
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>
          {filteredMovies.length} {filteredMovies.length === 1 ? "movie" : "movies"} available
        </p>
      </div>

      {/* Filters - More compact */}
      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Search Bar */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ position: "relative" }}>
            <svg
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "#9ca3af",
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search for movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#dc2626")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  fontSize: "18px",
                  padding: "4px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
              background: selectedLocation !== "all" ? "#fef2f2" : "white",
              color: selectedLocation !== "all" ? "#dc2626" : "#374151",
              fontWeight: selectedLocation !== "all" ? "500" : "400",
              outline: "none",
            }}
          >
            <option value="all">All Cities</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
              background: selectedLanguage !== "all" ? "#fef2f2" : "white",
              color: selectedLanguage !== "all" ? "#dc2626" : "#374151",
              fontWeight: selectedLanguage !== "all" ? "500" : "400",
              outline: "none",
            }}
          >
            <option value="all">All Languages</option>
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          {/* Genre Filter */}
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
              background: selectedGenre !== "all" ? "#fef2f2" : "white",
              color: selectedGenre !== "all" ? "#dc2626" : "#374151",
              fontWeight: selectedGenre !== "all" ? "500" : "400",
              outline: "none",
            }}
          >
            <option value="all">All Genres</option>
            {availableGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              style={{
                padding: "10px 12px",
                background: "transparent",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                color: "#6b7280",
                whiteSpace: "nowrap",
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
              Clear ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* No Results */}
      {filteredMovies.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: "0 0 6px 0", color: "#111827", fontSize: "18px" }}>No movies found</h3>
          <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>
            Try adjusting your filters
          </p>
          <button
            onClick={clearFilters}
            style={{
              padding: "10px 20px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
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
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
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