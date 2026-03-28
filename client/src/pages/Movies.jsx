// Movies.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import MovieCard, { MovieCardSkeleton } from "../components/MovieCard";
import Shows from "./Shows";
import Seats from "./Seats";
import styles from "./Movies.module.css";

function Movies() {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);

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

  useEffect(() => {
    let result = movies;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q))
      );
    }
    if (selectedLanguage !== "all") {
      result = result.filter(
        (m) => m.language?.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }
    if (selectedGenre !== "all") {
      result = result.filter(
        (m) => m.genre?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
      );
    }
    setFilteredMovies(result);
  }, [searchQuery, selectedLanguage, selectedGenre, movies]);

  const availableLanguages = [...new Set(movies.map((m) => m.language).filter(Boolean))];
  const availableGenres = [...new Set(movies.flatMap((m) => m.genre || []).filter(Boolean))];

  const activeFiltersCount = [
    searchQuery,
    selectedLocation !== "all",
    selectedLanguage !== "all",
    selectedGenre !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLocation("all");
    setSelectedLanguage("all");
    setSelectedGenre("all");
  };

  /* ── Route to sub-pages ── */
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Now Showing</p>
          <h1 className={styles.heading}>What's On</h1>
        </div>
        <div className={styles.grid}>
          {Array.from({ length: 10 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>{error}</div>
        <button className={styles.retryBtn} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <p className={styles.eyebrow}>Now Showing</p>
        <h1 className={styles.heading}>What's On</h1>
        <p className={styles.subheading}>
          <span className={styles.count}>{filteredMovies.length}</span>{" "}
          {filteredMovies.length === 1 ? "movie" : "movies"} available
        </p>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search movies…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button className={styles.searchClear} onClick={() => setSearchQuery("")}>
              ×
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className={styles.filterRow}>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className={`${styles.select} ${selectedLocation !== "all" ? styles.selectActive : ""}`}
          >
            <option value="all">All Cities</option>
            {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className={`${styles.select} ${selectedLanguage !== "all" ? styles.selectActive : ""}`}
          >
            <option value="all">All Languages</option>
            {availableLanguages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className={`${styles.select} ${selectedGenre !== "all" ? styles.selectActive : ""}`}
          >
            <option value="all">All Genres</option>
            {availableGenres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          {activeFiltersCount > 0 && (
            <button className={styles.clearBtn} onClick={clearFilters}>
              <span className={styles.clearBadge}>{activeFiltersCount}</span>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {filteredMovies.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🎬</span>
            <p className={styles.emptyTitle}>No movies found</p>
            <p className={styles.emptyText}>Try adjusting your filters</p>
            <button className={styles.emptyBtn} onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredMovies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              onSelect={() => setSelectedMovie(movie)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Movies;