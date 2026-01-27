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
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          padding: "10px 20px",
          marginBottom: "24px",
          background: "transparent",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
          color: "#6b7280",
          display: "flex",
          alignItems: "center",
          gap: "8px",
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
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Movies
      </button>

      {/* Movie Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "700", color: "#111827" }}>
          {movie.title}
        </h1>
        {movie.description && (
          <p style={{ color: "#6b7280", margin: "0 0 16px 0", fontSize: "15px", lineHeight: "1.6" }}>
            {movie.description}
          </p>
        )}

        {/* Location Filter */}
        {locations.length > 1 && (
          <div style={{ marginTop: "20px" }}>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
                background: filterLocation !== "all" ? "#fef2f2" : "white",
                color: filterLocation !== "all" ? "#dc2626" : "#374151",
                fontWeight: filterLocation !== "all" ? "500" : "400",
                minWidth: "200px",
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

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f4f6",
              borderTopColor: "#dc2626",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading shows...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
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
      )}

      {/* No Shows */}
      {!loading && !error && filteredShows.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>
            No shows available
            {filterLocation !== "all" ? ` in ${filterLocation}` : ""}.
          </p>
          {filterLocation !== "all" && (
            <button
              onClick={() => setFilterLocation("all")}
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
              Show All Cities
            </button>
          )}
        </div>
      )}

      {/* Theater Groups */}
      {!loading && !error && theaterGroups.length > 0 && (
        <div>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "600", color: "#111827" }}>
            Available Shows ({filteredShows.length})
            {filterLocation !== "all" && ` in ${filterLocation}`}
          </h2>

          {theaterGroups.map((group) => (
            <div
              key={group.theater._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
                background: "#fff",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Theater Header */}
              <div
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  paddingBottom: "16px",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "600", color: "#111827" }}>
                  {group.theater.name}
                </h3>
                <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
                  {group.theater.location}
                  {group.theater.address && ` • ${group.theater.address}`}
                </p>
                {group.theater.amenities && group.theater.amenities.length > 0 && (
                  <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {group.theater.amenities.map((amenity) => (
                      <span
                        key={amenity}
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

              {/* Shows Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                {group.shows
                  .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                  .map((show) => {
                    const showDate = new Date(show.startTime);
                    const isPast = showDate < new Date();
                    const formattedDate = showDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                    const formattedTime = showDate.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={show._id}
                        onClick={() => !isPast && onSelectShow(show)}
                        style={{
                          border: isPast ? "1px solid #f3f4f6" : "1px solid #e5e7eb",
                          padding: "16px",
                          cursor: isPast ? "not-allowed" : "pointer",
                          borderRadius: "8px",
                          transition: "all 0.2s",
                          background: isPast ? "#fafafa" : "#fff",
                          opacity: isPast ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isPast) {
                            e.currentTarget.style.borderColor = "#dc2626";
                            e.currentTarget.style.background = "#fef2f2";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isPast) {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "#fff";
                          }
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                          <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#111827" }}>
                            {show.screen}
                          </p>
                          <div
                            style={{
                              padding: "4px 10px",
                              background: isPast ? "#f3f4f6" : "#fef2f2",
                              color: isPast ? "#9ca3af" : "#dc2626",
                              borderRadius: "6px",
                              fontWeight: "600",
                              fontSize: "14px",
                            }}
                          >
                            ₹{show.price}
                          </div>
                        </div>

                        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                          {formattedDate}
                        </div>

                        <div style={{ 
                          fontSize: "16px", 
                          fontWeight: "600",
                          color: isPast ? "#9ca3af" : "#dc2626",
                        }}>
                          {formattedTime}
                        </div>

                        {isPast && (
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: "8px",
                              fontSize: "11px",
                              padding: "4px 8px",
                              background: "#f3f4f6",
                              color: "#6b7280",
                              borderRadius: "4px",
                              fontWeight: "500",
                              textTransform: "uppercase",
                            }}
                          >
                            Show Ended
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Shows;