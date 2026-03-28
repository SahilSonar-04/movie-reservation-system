// Shows.jsx
import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import ShowCard from "../components/ShowCard";
import styles from "./Shows.module.css";

const buildDateTabs = (shows, daysAhead = 8) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
      label: i === 0 ? "Today" : i === 1 ? "Tmrw" : d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return tabs;
};

function DateTab({ tab, isSelected, onClick }) {
  const cls = [
    styles.dateTab,
    isSelected ? styles.dateTabActive : "",
    !tab.hasShows ? styles.dateTabDisabled : "",
  ].join(" ");

  return (
    <div className={cls} onClick={tab.hasShows ? onClick : undefined}>
      <span className={styles.tabLabel}>{tab.label}</span>
      <span className={styles.tabDay}>{tab.dayNum}</span>
      <span className={styles.tabMonth}>{tab.month}</span>
      {tab.hasShows && <span className={styles.tabDot} />}
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

  const locationFiltered = useMemo(() => {
    if (filterLocation === "all") return allShows;
    return allShows.filter(
      (s) => s.theater?.location?.toLowerCase() === filterLocation.toLowerCase()
    );
  }, [allShows, filterLocation]);

  const dateTabs = useMemo(() => buildDateTabs(locationFiltered), [locationFiltered]);

  const showsOnDate = useMemo(() => {
    if (!selectedDateTs) return [];
    return locationFiltered.filter((s) => {
      const d = new Date(s.startTime);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === selectedDateTs;
    });
  }, [locationFiltered, selectedDateTs]);

  useEffect(() => {
    if (locationFiltered.length > 0) {
      const firstDate = new Date(locationFiltered[0].startTime);
      firstDate.setHours(0, 0, 0, 0);
      setSelectedDateTs(firstDate.getTime());
    } else {
      setSelectedDateTs(null);
    }
  }, [filterLocation]);

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
    <div className={styles.page}>

      {/* Back */}
      <button className={styles.backBtn} onClick={onBack}>
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Movies
      </button>

      {/* Movie header */}
      <div className={styles.movieHeader}>
        {movie.posterUrl && (
          <img src={movie.posterUrl} alt={movie.title} className={styles.moviePoster} />
        )}
        <div className={styles.movieInfo}>
          <h1 className={styles.movieTitle}>{movie.title}</h1>
          <div className={styles.movieMeta}>
            {movie.duration && <span className={styles.metaTag}>{movie.duration} mins</span>}
            {movie.language && <span className={styles.metaTag}>{movie.language}</span>}
            {movie.genre?.map((g) => (
              <span key={g} className={styles.metaTag}>{g}</span>
            ))}
          </div>
          {movie.description && (
            <p className={styles.movieDesc}>{movie.description}</p>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          Loading shows…
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Not found */}
      {notFound && (
        <div className={styles.emptyBox}>
          <div className={styles.emptyIcon}>🎬</div>
          <p className={styles.emptyTitle}>Movie not found</p>
          <button className={styles.primaryBtn} onClick={onBack}>Back to Movies</button>
        </div>
      )}

      {/* Shows */}
      {!loading && !error && !notFound && allShows.length > 0 && (
        <>
          {/* Location filter */}
          {locations.length > 1 && (
            <div className={styles.locationWrap}>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className={`${styles.select} ${filterLocation !== "all" ? styles.selectActive : ""}`}
              >
                <option value="all">All Cities</option>
                {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          )}

          {/* Date tabs */}
          <div className={styles.dateStrip}>
            {dateTabs.map((tab) => (
              <DateTab
                key={tab.ts}
                tab={tab}
                isSelected={selectedDateTs === tab.ts}
                onClick={() => setSelectedDateTs(tab.ts)}
              />
            ))}
          </div>

          {/* Date heading */}
          {selectedDateObj && (
            <h2 className={styles.dateHeading}>
              {selectedDateObj.toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric",
              })}
              {filterLocation !== "all" && ` · ${filterLocation}`}
              <span className={styles.dateHeadingCount}>
                ({showsOnDate.length} {showsOnDate.length === 1 ? "show" : "shows"})
              </span>
            </h2>
          )}

          {/* No shows on date */}
          {showsOnDate.length === 0 && selectedDateTs && (
            <div className={styles.emptyBox}>
              <p>No shows on this date{filterLocation !== "all" ? ` in ${filterLocation}` : ""}.</p>
              {filterLocation !== "all" && (
                <button className={styles.primaryBtn} onClick={() => setFilterLocation("all")}>
                  Show All Cities
                </button>
              )}
            </div>
          )}

          {/* Theater groups */}
          {theaterGroups.map((group) => (
            <div key={group.theater._id} className={styles.theaterCard}>
              <div className={styles.theaterHeader}>
                <h3 className={styles.theaterName}>{group.theater.name}</h3>
                <p className={styles.theaterLocation}>
                  {group.theater.location}
                  {group.theater.address && ` · ${group.theater.address}`}
                </p>
                {group.theater.amenities?.length > 0 && (
                  <div className={styles.amenities}>
                    {group.theater.amenities.map((a) => (
                      <span key={a} className={styles.amenityTag}>{a}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.showsRow}>
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

      {/* No shows at all */}
      {!loading && !error && !notFound && allShows.length === 0 && (
        <div className={styles.emptyBox}>
          <p>No upcoming shows for this movie.</p>
        </div>
      )}
    </div>
  );
}

export default Shows;