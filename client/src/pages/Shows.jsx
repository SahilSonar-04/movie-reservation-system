import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import ShowCard from "../components/ShowCard";

// Build the next N days as selectable date tabs (matches what TMDB sync creates)
const buildDateTabs = (shows, daysAhead = 8) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Collect all unique dates that actually have shows
  const datesWithShows = new Set(
    shows.map((s) => {
      const d = new Date(s.startTime);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  const tabs = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    tabs.push({
      ts: d.getTime(),
      date: d,
      hasShows: datesWithShows.has(d.getTime()),
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return tabs;
};

function DateTab({ tab, isSelected, onClick }) {
  const base = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: tab.hasShows ? "pointer" : "default",
    border: "1px solid",
    minWidth: "64px",
    transition: "all 0.15s",
    opacity: tab.hasShows ? 1 : 0.38,
    userSelect: "none",
  };

  if (isSelected) {
    return (
      <div onClick={onClick} style={{ ...base, background: "#dc2626", borderColor: "#dc2626", color: "#fff" }}>
        <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.3px" }}>{tab.label}</span>
        <span style={{ fontSize: "22px", fontWeight: "700", lineHeight: 1.1 }}>{tab.dayNum}</span>
        <span style={{ fontSize: "11px", opacity: 0.85 }}>{tab.month}</span>
      </div>
    );
  }

  return (
    <div
      onClick={tab.hasShows ? onClick : undefined}
      style={{
        ...base,
        background: "#fff",
        borderColor: "#e5e7eb",
        color: tab.hasShows ? "#111827" : "#9ca3af",
      }}
      onMouseEnter={(e) => { if (tab.hasShows) e.currentTarget.style.borderColor = "#dc2626"; }}
      onMouseLeave={(e) => { if (tab.hasShows) e.currentTarget.style.borderColor = "#e5e7eb"; }}
    >
      <span style={{ fontSize: "11px", fontWeight: "500", color: "#6b7280" }}>{tab.label}</span>
      <span style={{ fontSize: "22px", fontWeight: "700", lineHeight: 1.1 }}>{tab.dayNum}</span>
      <span style={{ fontSize: "11px", color: "#6b7280" }}>{tab.month}</span>
      {tab.hasShows && (
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#dc2626", marginTop: "4px" }} />
      )}
    </div>
  );
}

function Shows({ movie, selectedLocation, onBack, onSelectShow }) {
  const [allShows, setAllShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [filterLocation, setFilterLocation] = useState(selectedLocation || "all");
  const [selectedDateTs, setSelectedDateTs] = useState(null);

  useEffect(() => {
    const fetchShows = async () => {
      try {
        setError("");
        setNotFound(false);
        const res = await api.get(`/shows/movie/${movie._id}`);
        const shows = res.data;
        setAllShows(shows);

        // Auto-select the first date that has shows
        if (shows.length > 0) {
          const firstDate = new Date(shows[0].startTime);
          firstDate.setHours(0, 0, 0, 0);
          setSelectedDateTs(firstDate.getTime());
        }
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else setError("Failed to load shows. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchShows();
  }, [movie._id]);

  // Location-filtered shows
  const locationFiltered = useMemo(() => {
    if (filterLocation === "all") return allShows;
    return allShows.filter(
      (s) => s.theater?.location?.toLowerCase() === filterLocation.toLowerCase()
    );
  }, [allShows, filterLocation]);

  // Date tabs built from location-filtered shows
  const dateTabs = useMemo(() => buildDateTabs(locationFiltered), [locationFiltered]);

  // Shows for the selected date
  const showsOnDate = useMemo(() => {
    if (!selectedDateTs) return [];
    return locationFiltered.filter((s) => {
      const d = new Date(s.startTime);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === selectedDateTs;
    });
  }, [locationFiltered, selectedDateTs]);

  // When location filter changes, reset to the first date with shows in the new filter
  useEffect(() => {
    if (locationFiltered.length > 0) {
      const firstDate = new Date(locationFiltered[0].startTime);
      firstDate.setHours(0, 0, 0, 0);
      setSelectedDateTs(firstDate.getTime());
    } else {
      setSelectedDateTs(null);
    }
  }, [filterLocation]);

  // Group shows-on-date by theater
  const theaterGroups = useMemo(() => {
    const map = {};
    for (const show of showsOnDate) {
      const id = show.theater._id;
      if (!map[id]) map[id] = { theater: show.theater, shows: [] };
      map[id].shows.push(show);
    }
    return Object.values(map);
  }, [showsOnDate]);

  const locations = useMemo(
    () => [...new Set(allShows.map((s) => s.theater?.location).filter(Boolean))],
    [allShows]
  );

  const selectedDateObj = selectedDateTs ? new Date(selectedDateTs) : null;

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          padding: "10px 20px", marginBottom: "24px", background: "transparent",
          border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer",
          fontSize: "14px", fontWeight: "500", color: "#6b7280",
          display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Movies
      </button>

      {/* Movie header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
          {movie.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{ width: "72px", height: "108px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: "700", color: "#111827" }}>
              {movie.title}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
              {movie.duration && <span>{movie.duration} mins</span>}
              {movie.language && <span>• {movie.language}</span>}
              {movie.genre?.length > 0 && <span>• {movie.genre.join(", ")}</span>}
            </div>
            {movie.description && (
              <p style={{ color: "#6b7280", margin: 0, fontSize: "14px", lineHeight: "1.6", maxWidth: "600px" }}>
                {movie.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: "40px", height: "40px", border: "4px solid #f3f4f6", borderTopColor: "#dc2626", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading shows...</p>
        </div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {notFound && (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎬</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#111827" }}>Movie not found</h3>
          <button onClick={onBack} style={{ padding: "10px 20px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>
            Back to Movies
          </button>
        </div>
      )}

      {!loading && !error && !notFound && allShows.length > 0 && (
        <>
          {/* Location filter */}
          {locations.length > 1 && (
            <div style={{ marginBottom: "24px" }}>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                style={{
                  padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px",
                  fontSize: "14px", cursor: "pointer", minWidth: "200px", outline: "none",
                  background: filterLocation !== "all" ? "#fef2f2" : "white",
                  color: filterLocation !== "all" ? "#dc2626" : "#374151",
                  fontWeight: filterLocation !== "all" ? "600" : "400",
                }}
              >
                <option value="all">All Cities</option>
                {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          )}

          {/* Date tab strip */}
          <div style={{ marginBottom: "28px" }}>
            <div
              style={{
                display: "flex", gap: "8px", overflowX: "auto",
                paddingBottom: "4px",
                scrollbarWidth: "none",
              }}
            >
              {dateTabs.map((tab) => (
                <DateTab
                  key={tab.ts}
                  tab={tab}
                  isSelected={selectedDateTs === tab.ts}
                  onClick={() => tab.hasShows && setSelectedDateTs(tab.ts)}
                />
              ))}
            </div>
          </div>

          {/* Selected date heading */}
          {selectedDateObj && (
            <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "600", color: "#111827" }}>
              Shows on{" "}
              {selectedDateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {filterLocation !== "all" && ` in ${filterLocation}`}
              <span style={{ fontSize: "14px", fontWeight: "400", color: "#6b7280", marginLeft: "8px" }}>
                ({showsOnDate.length} {showsOnDate.length === 1 ? "show" : "shows"})
              </span>
            </h2>
          )}

          {/* No shows on selected date */}
          {showsOnDate.length === 0 && selectedDateTs && (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <p style={{ color: "#6b7280", marginBottom: "16px" }}>
                No shows on this date{filterLocation !== "all" ? ` in ${filterLocation}` : ""}.
              </p>
              {filterLocation !== "all" && (
                <button
                  onClick={() => setFilterLocation("all")}
                  style={{ padding: "10px 20px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}
                >
                  Show All Cities
                </button>
              )}
            </div>
          )}

          {/* Theater groups for selected date */}
          {theaterGroups.map((group) => (
            <div
              key={group.theater._id}
              style={{
                border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px",
                marginBottom: "20px", background: "#fff",
                boxShadow: "0 1px 3px 0 rgba(0,0,0,0.07)",
              }}
            >
              <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "16px", marginBottom: "20px" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                  {group.theater.name}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                  {group.theater.location}{group.theater.address && ` • ${group.theater.address}`}
                </p>
                {group.theater.amenities?.length > 0 && (
                  <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {group.theater.amenities.map((a) => (
                      <span key={a} style={{ fontSize: "12px", padding: "3px 10px", background: "#f3f4f6", color: "#4b5563", borderRadius: "6px", fontWeight: "500" }}>
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {group.shows
                  .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                  .map((show) => (
                    <ShowCard key={show._id} show={show} onSelect={onSelectShow} />
                  ))}
              </div>
            </div>
          ))}
        </>
      )}

      {!loading && !error && !notFound && allShows.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <p style={{ color: "#6b7280" }}>No upcoming shows for this movie.</p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

export default Shows;