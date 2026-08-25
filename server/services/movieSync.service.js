import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Show from "../models/show.model.js";
import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";
import generateSeats from "../utils/seatGenerator.js";
import logger from "../utils/logger.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// Language code → readable name
const LANGUAGE_MAP = {
  en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu",
  ml: "Malayalam", kn: "Kannada", mr: "Marathi", bn: "Bengali",
  pa: "Punjabi", fr: "French", es: "Spanish", ja: "Japanese",
  ko: "Korean", zh: "Chinese", de: "German", it: "Italian",
};

// Predefined default Indian theaters if none exist
const DEFAULT_THEATERS = [
  {
    name: "PVR Phoenix Mall",
    location: "Mumbai",
    address: "462, Senapati Bapat Marg, Lower Parel, Mumbai - 400013",
    amenities: ["Dolby Atmos", "4DX", "Parking", "Food Court"],
  },
  {
    name: "INOX Insignia",
    location: "Bangalore",
    address: "4, Vittal Mallya Rd, Shanthala Nagar, Bangalore - 560001",
    amenities: ["IMAX", "Dolby Atmos", "Valet Parking", "Lounge"],
  },
  {
    name: "Cinepolis Fun Republic",
    location: "Delhi",
    address: "Fun Republic Mall, Andheri West, Delhi - 110001",
    amenities: ["3D", "Dolby Atmos", "Parking", "Cafeteria"],
  },
];

// Show time slots
const SHOW_SLOTS = [
  { hour: 10, minute: 0, screen: "Screen 1" },
  { hour: 14, minute: 0, screen: "Screen 2" },
  { hour: 18, minute: 0, screen: "Screen 3" },
  { hour: 21, minute: 30, screen: "Screen 4" },
];

const PRICE_BY_SLOT = [180, 220, 280, 320];
const DAYS_AHEAD = 7;
const ROWS = 6;
const SEATS_PER_ROW = 12;

// In-memory status tracker
const syncStatus = {
  isRunning: false,
  lastSyncTime: null,
  lastSyncStatus: "IDLE",
  lastSyncResults: null,
  nextSyncTime: null,
  intervalHours: parseInt(process.env.TMDB_SYNC_INTERVAL_HOURS, 10) || 12,
};

/**
 * Fetch now-playing movies from TMDB
 */
export const fetchNowPlayingMovies = async () => {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new Error("TMDB_ACCESS_TOKEN not set in environment variables");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const listRes = await fetch(`${TMDB_BASE_URL}/movie/now_playing?language=en-US&page=1&region=IN`, { headers });
  if (!listRes.ok) {
    throw new Error(`TMDB list fetch failed with status ${listRes.status}`);
  }
  const listData = await listRes.json();
  const movies = (listData.results || []).slice(0, 10);

  // Fetch full details (runtime, genres)
  const detailedMovies = await Promise.all(
    movies.map(async (movie) => {
      try {
        const detailRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}?language=en-US`, { headers });
        if (!detailRes.ok) return null;
        return await detailRes.json();
      } catch {
        return null;
      }
    })
  );

  return detailedMovies.filter(Boolean);
};

/**
 * Ensure default theaters exist
 */
export const ensureTheatersExist = async () => {
  const existing = await Theater.find();
  if (existing.length > 0) return existing;

  const created = await Theater.insertMany(DEFAULT_THEATERS);
  logger.info(`[MovieSync] Created ${created.length} default theaters`);
  return created;
};

/**
 * Generate show dates for the next N days
 */
export const generateShowDates = () => {
  const dates = [];
  const now = new Date();

  for (let day = 1; day <= DAYS_AHEAD; day++) {
    for (let slotIdx = 0; slotIdx < SHOW_SLOTS.length; slotIdx++) {
      const slot = SHOW_SLOTS[slotIdx];
      const date = new Date(now);
      date.setDate(now.getDate() + day);
      date.setHours(slot.hour, slot.minute, 0, 0);
      dates.push({ date, screen: slot.screen, price: PRICE_BY_SLOT[slotIdx] });
    }
  }

  return dates;
};

/**
 * Find and remove duplicate movies, merging their shows to canonical records
 */
export const deduplicateMovies = async () => {
  let duplicatesMerged = 0;
  const allMovies = await Movie.find().sort({ createdAt: 1 });

  const tmdbMap = new Map(); // tmdbId -> canonical movie
  const titleMap = new Map(); // normalized title -> canonical movie
  const deletedIds = new Set();

  for (const movie of allMovies) {
    if (deletedIds.has(movie._id.toString())) continue;

    const normTitle = movie.title.toLowerCase().trim();
    let canonical = null;

    if (movie.tmdbId && tmdbMap.has(movie.tmdbId)) {
      canonical = tmdbMap.get(movie.tmdbId);
    } else if (titleMap.has(normTitle)) {
      canonical = titleMap.get(normTitle);
    }

    if (!canonical) {
      if (movie.tmdbId) tmdbMap.set(movie.tmdbId, movie);
      titleMap.set(normTitle, movie);
    } else {
      const duplicateId = movie._id;

      // Transfer tmdbId to canonical if canonical didn't have one
      if (movie.tmdbId && !canonical.tmdbId) {
        canonical.tmdbId = movie.tmdbId;
        await canonical.save();
        tmdbMap.set(movie.tmdbId, canonical);
      }

      // Reassign all shows from duplicate to canonical movie
      await Show.updateMany({ movie: duplicateId }, { $set: { movie: canonical._id } });

      // Delete the duplicate movie
      await Movie.findByIdAndDelete(duplicateId);
      deletedIds.add(duplicateId.toString());
      duplicatesMerged++;
      logger.info(`[MovieSync] Merged duplicate movie "${movie.title}" (${duplicateId}) into (${canonical._id})`);
    }
  }

  return duplicatesMerged;
};

/**
 * Remove stale movies with no available/upcoming shows
 */
export const cleanupStaleMovies = async () => {
  const now = new Date();
  const results = {
    moviesRemoved: 0,
    moviesDeactivated: 0,
    showsCleaned: 0,
    seatsCleaned: 0,
    duplicatesMerged: 0,
  };

  // 1. Merge duplicates first
  results.duplicatesMerged = await deduplicateMovies();

  // 2. Identify active shows & booked shows
  const upcomingShowMovieIds = await Show.distinct("movie", { startTime: { $gte: now } });
  const bookedShowIds = await Booking.distinct("show", { status: "CONFIRMED" });
  const bookedMovieIds = await Show.distinct("movie", { _id: { $in: bookedShowIds } });

  const activeMovieIdSet = new Set(upcomingShowMovieIds.map(String));
  const bookedMovieIdSet = new Set(bookedMovieIds.map(String));

  // 3. Reactivate movies with upcoming shows
  if (upcomingShowMovieIds.length > 0) {
    await Movie.updateMany(
      { _id: { $in: upcomingShowMovieIds }, isActive: false },
      { $set: { isActive: true } }
    );
  }

  // 4. Deactivate movies with no upcoming shows but have historical bookings
  const moviesToDeactivate = [...bookedMovieIdSet].filter((id) => !activeMovieIdSet.has(id));
  if (moviesToDeactivate.length > 0) {
    const deactRes = await Movie.updateMany(
      { _id: { $in: moviesToDeactivate }, isActive: { $ne: false } },
      { $set: { isActive: false } }
    );
    results.moviesDeactivated = deactRes.modifiedCount || 0;
  }

  // 5. Delete movies with no upcoming shows and no bookings
  const moviesToDelete = await Movie.find(
    { _id: { $nin: [...upcomingShowMovieIds, ...bookedMovieIds] } },
    "_id title"
  );

  const movieIdsToDelete = moviesToDelete.map((m) => m._id);
  if (movieIdsToDelete.length > 0) {
    for (const m of moviesToDelete) {
      logger.info(`[MovieSync] Purged stale movie "${m.title}" with 0 upcoming shows and 0 bookings`);
    }

    const [delShows, delBookings, delMovies] = await Promise.all([
      Show.deleteMany({ movie: { $in: movieIdsToDelete } }),
      Booking.deleteMany({ show: { $in: movieIdsToDelete }, status: "CANCELLED" }),
      Movie.deleteMany({ _id: { $in: movieIdsToDelete } }),
    ]);

    results.showsCleaned += delShows.deletedCount || 0;
    results.moviesRemoved += delMovies.deletedCount || 0;
  }

  // 6. Delete past unbooked shows older than 24 hours
  const pastCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oldPastUnbookedShows = await Show.find(
    { startTime: { $lt: pastCutoff }, _id: { $nin: bookedShowIds } },
    "_id"
  );
  const oldShowIds = oldPastUnbookedShows.map((s) => s._id);
  if (oldShowIds.length > 0) {
    const [delOldShows] = await Promise.all([
      Show.deleteMany({ _id: { $in: oldShowIds } }),
      Booking.deleteMany({ show: { $in: oldShowIds }, status: "CANCELLED" }),
    ]);
    results.showsCleaned += delOldShows.deletedCount || 0;
  }

  // 7. Clean up orphaned seats & unbooked free seats of past shows
  const validShowIds = await Show.distinct("_id");
  const [delOrphanSeats, delPastFreeSeats] = await Promise.all([
    Seat.deleteMany({ show: { $nin: validShowIds } }),
    Seat.deleteMany({ show: { $in: bookedShowIds }, status: "FREE" }),
  ]);
  results.seatsCleaned += (delOrphanSeats.deletedCount || 0) + (delPastFreeSeats.deletedCount || 0);

  return results;
};

/**
 * Main synchronizer: Fetches TMDB movies, updates/creates them, tops up show schedules,
 * removes duplicates, and cleans up stale movies.
 */
export const syncMovies = async () => {
  if (syncStatus.isRunning) {
    logger.warn("[MovieSync] Sync already in progress, skipping duplicate call");
    return {
      message: "Sync already in progress",
      alreadyRunning: true,
    };
  }

  syncStatus.isRunning = true;
  syncStatus.lastSyncStatus = "IN_PROGRESS";

  const results = {
    moviesCreated: 0,
    moviesUpdated: 0,
    showsCreated: 0,
    duplicatesMerged: 0,
    moviesRemoved: 0,
    moviesDeactivated: 0,
    theatersCount: 0,
    errors: [],
  };

  try {
    // 1. Run deduplication
    results.duplicatesMerged = await deduplicateMovies();

    // 2. Fetch from TMDB
    const tmdbMovies = await fetchNowPlayingMovies();

    // 3. Ensure theaters exist
    const theaters = await ensureTheatersExist();
    results.theatersCount = theaters.length;

    const showDates = generateShowDates();

    // 4. Process each TMDB movie
    for (const tmdb of tmdbMovies) {
      const title = tmdb.title?.trim();
      if (!title) continue;

      try {
        // Search by tmdbId or normalized title
        let movie = await Movie.findOne({
          $or: [
            { tmdbId: tmdb.id },
            { title: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
          ],
        });

        const movieData = {
          tmdbId: tmdb.id,
          title,
          description: tmdb.overview || "",
          duration: tmdb.runtime || 120,
          language: LANGUAGE_MAP[tmdb.original_language] || tmdb.original_language || "English",
          genre: tmdb.genres?.map((g) => g.name) || [],
          posterUrl: tmdb.poster_path ? `${TMDB_IMAGE_BASE}${tmdb.poster_path}` : "",
          isActive: true,
        };

        if (movie) {
          // Update existing movie
          Object.assign(movie, movieData);
          await movie.save();
          results.moviesUpdated++;
        } else {
          // Create new movie
          movie = await Movie.create(movieData);
          results.moviesCreated++;
        }

        // Generate shows for each theater × each slot for the next 7 days
        for (const theater of theaters) {
          for (const { date, screen, price } of showDates) {
            try {
              // Check if show already exists for this theater/screen/startTime
              const existingShow = await Show.findOne({
                theater: theater._id,
                screen,
                startTime: date,
              });

              if (existingShow) {
                // Show slot is already occupied, skip
                continue;
              }

              const show = await Show.create({
                movie: movie._id,
                theater: theater._id,
                screen,
                startTime: date,
                price,
              });

              // Generate seats for the show
              const seatNumbers = generateSeats({ rows: ROWS, seatsPerRow: SEATS_PER_ROW });
              await Seat.insertMany(
                seatNumbers.map((seatNumber) => ({ show: show._id, seatNumber }))
              );

              results.showsCreated++;
            } catch (showErr) {
              // Duplicate key or creation error
              if (showErr.code !== 11000) {
                results.errors.push(`Show creation failed for ${title}: ${showErr.message}`);
              }
            }
          }
        }
      } catch (movieErr) {
        results.errors.push(`Movie processing failed for ${title}: ${movieErr.message}`);
      }
    }

    // 5. Cleanup stale movies with no available shows
    const cleanupResults = await cleanupStaleMovies();
    results.moviesRemoved = cleanupResults.moviesRemoved;
    results.moviesDeactivated = cleanupResults.moviesDeactivated;
    results.showsCleaned = cleanupResults.showsCleaned;

    syncStatus.lastSyncStatus = "SUCCESS";
    syncStatus.lastSyncTime = new Date();
    syncStatus.lastSyncResults = results;

    logger.info(
      `[MovieSync] Complete — ${results.moviesCreated} created, ${results.moviesUpdated} updated, ` +
      `${results.showsCreated} shows created, ${results.moviesRemoved} stale removed, ${results.duplicatesMerged} duplicates merged`
    );
  } catch (err) {
    syncStatus.lastSyncStatus = "FAILED";
    syncStatus.lastSyncTime = new Date();
    results.errors.push(err.message);
    syncStatus.lastSyncResults = results;
    logger.error(`[MovieSync] Error during sync: ${err.message}`, { stack: err.stack });
    throw err;
  } finally {
    syncStatus.isRunning = false;
    const intervalMs = (syncStatus.intervalHours || 12) * 60 * 60 * 1000;
    syncStatus.nextSyncTime = new Date(Date.now() + intervalMs);
  }

  return results;
};

/**
 * Get current sync status
 */
export const getSyncStatus = () => {
  return {
    ...syncStatus,
    intervalHours: syncStatus.intervalHours,
  };
};

/**
 * Set next sync time helper
 */
export const setNextSyncTime = (date) => {
  syncStatus.nextSyncTime = date;
};
