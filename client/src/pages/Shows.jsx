import { useEffect, useState } from "react";
import api from "../services/api";

function Shows({ movie, selectedLocation, onBack, onSelectShow }) {
  const [allShows, setAllShows] = useState([]);
  const [filteredShows, setFilteredShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterLocation, setFilterLocation] = useState(selectedLocation || "all");

  useEffect(() => {
    const fetchShows = async () => {
      try {
        setError("");
        const res = await api.get(`/shows/movie/${movie._id}`);
        setAllShows(res.data);
        setFilteredShows(res.data);
      } catch (err) {
        console.error("Failed to load shows", err);
        setError("Failed to load shows. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchShows();
  }, [movie._id]);

  // Filter shows by location
  useEffect(() => {
    if (filterLocation === "all") {
      setFilteredShows(allShows);
    } else {
      setFilteredShows(
        allShows.filter(
          (show) =>
            show.theater &&
            show.theater.location.toLowerCase() === filterLocation.toLowerCase()
        )
      );
    }
  }, [filterLocation, allShows]);

  // Group shows by theater
  const groupedByTheater = filteredShows.reduce((acc, show) => {
    const theaterId = show.theater._id;
    if (!acc[theaterId]) {
      acc[theaterId] = {
        theater: show.theater,
        shows: [],
      };
    }
    acc[theaterId].shows.push(show);
    return acc;
  }, {});

  const theaterGroups = Object.values(groupedByTheater);

  // Get unique locations
  const locations = [...new Set(allShows.map((s) => s.theater?.location).filter(Boolean))];

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          padding: "8px 16px",
          marginBottom: "16px",
          background: "#f5f5f5",
          border: "1px solid #ddd",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        ← Back to Movies
      </button>

      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0" }}>{movie.title}</h2>
        {movie.description && (
          <p style={{ color: "#666", margin: "0 0 16px 0" }}>{movie.description}</p>
        )}

        {locations.length > 1 && (
          <div style={{ marginTop: "16px" }}>
            <label style={{ marginRight: "8px", fontWeight: "bold" }}>
              Filter by City:
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                cursor: "pointer",
                background: filterLocation !== "all" ? "#e6f7ff" : "white",
              }}
            >
              <option value="all">All Cities</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading shows...</p>
        </div>
      )}

      {error && (
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
      )}

      {!loading && !error && filteredShows.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>
            No shows available
            {filterLocation !== "all" ? ` in ${filterLocation}` : ""}.
          </p>
          {filterLocation !== "all" && (
            <button
              onClick={() => setFilterLocation("all")}
              style={{
                padding: "8px 16px",
                marginTop: "12px",
                background: "#1890ff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Show All Cities
            </button>
          )}
        </div>
      )}

      {!loading && !error && theaterGroups.length > 0 && (
        <div>
          <h3>
            Available Shows ({filteredShows.length})
            {filterLocation !== "all" && ` in ${filterLocation}`}
          </h3>

          {theaterGroups.map((group) => (
            <div
              key={group.theater._id}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "20px",
                background: "#fff",
              }}
            >
              {/* Theater Header */}
              <div
                style={{
                  borderBottom: "2px solid #f0f0f0",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                }}
              >
                <h4 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
                  🎭 {group.theater.name}
                </h4>
                <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
                  📍 {group.theater.location}
                  {group.theater.address && ` - ${group.theater.address}`}
                </p>
                {group.theater.amenities && group.theater.amenities.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    {group.theater.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        style={{
                          display: "inline-block",
                          background: "#f0f0f0",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          marginRight: "6px",
                          marginTop: "4px",
                        }}
                      >
                        ✨ {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Shows for this theater */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {group.shows
                  .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                  .map((show) => {
                    const showDate = new Date(show.startTime);
                    const isPast = showDate < new Date();

                    return (
                      <div
                        key={show._id}
                        onClick={() => !isPast && onSelectShow(show)}
                        style={{
                          border: isPast ? "1px solid #f0f0f0" : "1px solid #1890ff",
                          borderRadius: "6px",
                          padding: "12px",
                          cursor: isPast ? "not-allowed" : "pointer",
                          background: isPast ? "#fafafa" : "white",
                          transition: "all 0.2s",
                          opacity: isPast ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isPast) {
                            e.currentTarget.style.background = "#e6f7ff";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isPast) {
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontWeight: "bold",
                            fontSize: "14px",
                          }}
                        >
                          {show.screen}
                        </p>

                        <p
                          style={{
                            margin: "4px 0",
                            fontSize: "13px",
                            color: "#666",
                          }}
                        >
                          📅 {showDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>

                        <p
                          style={{
                            margin: "4px 0",
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: isPast ? "#999" : "#1890ff",
                          }}
                        >
                          🕐 {showDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        <p
                          style={{
                            margin: "8px 0 0 0",
                            fontSize: "14px",
                            color: isPast ? "#999" : "#52c41a",
                            fontWeight: "bold",
                          }}
                        >
                          ₹{show.price}
                        </p>

                        {isPast && (
                          <p
                            style={{
                              margin: "8px 0 0 0",
                              fontSize: "12px",
                              color: "#ff4d4f",
                            }}
                          >
                            Show Ended
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Shows;