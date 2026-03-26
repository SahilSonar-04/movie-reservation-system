import { useEffect, useState } from "react";
import api from "../services/api";
import ShowCard from "../components/ShowCard";

function Shows({ movie, selectedLocation, onBack, onSelectShow }) {
  const [allShows, setAllShows] = useState([]);
  const [filteredShows, setFilteredShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [filterLocation, setFilterLocation] = useState(selectedLocation || "all");

  useEffect(() => {
    const fetchShows = async () => {
      try {
        setError("");
        setNotFound(false);
        const res = await api.get(`/shows/movie/${movie._id}`);
        setAllShows(res.data);
        setFilteredShows(res.data);
      } catch (err) {
        console.error("Failed to load shows", err);
        if (err.response?.status === 404) setNotFound(true);
        else setError("Failed to load shows. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchShows();
  }, [movie._id]);

  useEffect(() => {
    if (filterLocation === "all") {
      setFilteredShows(allShows);
    } else {
      setFilteredShows(
        allShows.filter(
          (show) => show.theater && show.theater.location.toLowerCase() === filterLocation.toLowerCase()
        )
      );
    }
  }, [filterLocation, allShows]);

  // Group shows by theater
  const groupedByTheater = filteredShows.reduce((acc, show) => {
    const theaterId = show.theater._id;
    if (!acc[theaterId]) acc[theaterId] = { theater: show.theater, shows: [] };
    acc[theaterId].shows.push(show);
    return acc;
  }, {});

  const theaterGroups = Object.values(groupedByTheater);
  const locations = [...new Set(allShows.map((s) => s.theater?.location).filter(Boolean))];

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{ padding: "10px 20px", marginBottom: "24px", background: "transparent", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: "#6b7280", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
        onMouseEnter={(e) => { e.target.style.borderColor = "#dc2626"; e.target.style.color = "#dc2626"; }}
        onMouseLeave={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.color = "#6b7280"; }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Movies
      </button>

      {/* Movie Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "700", color: "#111827" }}>{movie.title}</h1>
        {movie.description && (
          <p style={{ color: "#6b7280", margin: "0 0 16px 0", fontSize: "15px", lineHeight: "1.6" }}>{movie.description}</p>
        )}
        {locations.length > 1 && (
          <div style={{ marginTop: "20px" }}>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              style={{ padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", cursor: "pointer", background: filterLocation !== "all" ? "#fef2f2" : "white", color: filterLocation !== "all" ? "#dc2626" : "#374151", fontWeight: filterLocation !== "all" ? "500" : "400", minWidth: "200px" }}
            >
              <option value="all">All Cities</option>
              {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: "40px", height: "40px", border: "4px solid #f3f4f6", borderTopColor: "#dc2626", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading shows...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>
      )}

      {/* Not Found */}
      {notFound && (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎬</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "18px" }}>Movie not found</h3>
          <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>This movie doesn't exist or may have been removed.</p>
          <button onClick={onBack} style={{ padding: "10px 20px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>Back to Movies</button>
        </div>
      )}

      {/* No Shows */}
      {!loading && !error && filteredShows.length === 0 && !notFound && (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>No shows available{filterLocation !== "all" ? ` in ${filterLocation}` : ""}.</p>
          {filterLocation !== "all" && (
            <button onClick={() => setFilterLocation("all")} style={{ padding: "10px 20px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>Show All Cities</button>
          )}
        </div>
      )}

      {/* Theater Groups with ShowCard */}
      {!loading && !error && theaterGroups.length > 0 && (
        <div>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "600", color: "#111827" }}>
            Available Shows ({filteredShows.length}){filterLocation !== "all" && ` in ${filterLocation}`}
          </h2>

          {theaterGroups.map((group) => (
            <div
              key={group.theater._id}
              style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", marginBottom: "24px", background: "#fff", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}
            >
              {/* Theater Header */}
              <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "16px", marginBottom: "20px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "600", color: "#111827" }}>{group.theater.name}</h3>
                <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
                  {group.theater.location}{group.theater.address && ` • ${group.theater.address}`}
                </p>
                {group.theater.amenities && group.theater.amenities.length > 0 && (
                  <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {group.theater.amenities.map((amenity) => (
                      <span key={amenity} style={{ fontSize: "12px", padding: "4px 10px", background: "#f3f4f6", color: "#4b5563", borderRadius: "6px", fontWeight: "500" }}>{amenity}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Shows Grid — using ShowCard component */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                {group.shows
                  .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                  .map((show) => (
                    <ShowCard key={show._id} show={show} onSelect={onSelectShow} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Shows;