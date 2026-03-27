import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Show from "../models/show.model.js";
import Seat from "../models/seat.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateSeats from "../utils/seatGenerator.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// Language code → readable name
const LANGUAGE_MAP = {
  en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu",
  ml: "Malayalam", kn: "Kannada", mr: "Marathi", bn: "Bengali",
  pa: "Punjabi", fr: "French", es: "Spanish", ja: "Japanese",
  ko: "Korean", zh: "Chinese", de: "German", it: "Italian",
};

// Predefined Indian theaters to auto-create if none exist
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

// Show time slots (hour, minute)
const SHOW_SLOTS = [
  { hour: 10, minute: 0, screen: "Screen 1" },
  { hour: 14, minute: 0, screen: "Screen 2" },
  { hour: 18, minute: 0, screen: "Screen 3" },
  { hour: 21, minute: 30, screen: "Screen 4" },
];

const PRICE_BY_SLOT = [180, 220, 280, 320]; // morning to night
const DAYS_AHEAD = 7;
const ROWS = 6;
const SEATS_PER_ROW = 12;

/**
 * Fetch now-playing movies from TMDB with full details (runtime + genres)
 */
const fetchNowPlayingMovies = async () => {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error("TMDB_ACCESS_TOKEN not set in environment");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Step 1: Get now playing list
  const listRes = await fetch(`${TMDB_BASE_URL}/movie/now_playing?language=en-US&page=1&region=IN`, { headers });
  if (!listRes.ok) throw new Error(`TMDB list fetch failed: ${listRes.status}`);
  const listData = await listRes.json();

  const movies = listData.results.slice(0, 10); // limit to 10

  // Step 2: Fetch full details (runtime + genres) for each movie
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
 * Ensure default theaters exist, return all theaters
 */
const ensureTheatersExist = async () => {
  const existing = await Theater.find();
  if (existing.length > 0) return existing;

  // No theaters at all — create defaults
  const created = await Theater.insertMany(DEFAULT_THEATERS);
  console.log(`[TMDB SYNC] Created ${created.length} default theaters`);
  return created;
};

/**
 * Generate show start times for the next N days
 */
const generateShowDates = () => {
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
 * Main sync handler
 * POST /api/admin/sync-movies
 */
export const syncMoviesFromTMDB = asyncHandler(async (req, res) => {
  const results = {
    moviesCreated: 0,
    moviesSkipped: 0,
    showsCreated: 0,
    theatersCreated: 0,
    errors: [],
  };

  // 1. Fetch from TMDB
  let tmdbMovies;
  try {
    tmdbMovies = await fetchNowPlayingMovies();
  } catch (err) {
    return res.status(500).json({ message: `TMDB fetch failed: ${err.message}` });
  }

  // 2. Ensure theaters exist
  const theaters = await ensureTheatersExist();
  const existingTheaterCount = await Theater.countDocuments();
  results.theatersCreated = Math.max(0, theaters.length - existingTheaterCount + theaters.length);

  // 3. Get existing movie titles to avoid duplicates
  const existingMovies = await Movie.find({}, "title tmdbId");
  const existingTitles = new Set(existingMovies.map((m) => m.title.toLowerCase().trim()));

  const showDates = generateShowDates();

  // 4. For each TMDB movie, create movie + shows
  for (const tmdb of tmdbMovies) {
    const title = tmdb.title?.trim();
    if (!title) continue;

    // Skip if already imported
    if (existingTitles.has(title.toLowerCase())) {
      results.moviesSkipped++;
      continue;
    }

    try {
      // Create movie
      const movie = await Movie.create({
        title,
        description: tmdb.overview || "",
        duration: tmdb.runtime || 120,
        language: LANGUAGE_MAP[tmdb.original_language] || tmdb.original_language || "English",
        genre: tmdb.genres?.map((g) => g.name) || [],
        posterUrl: tmdb.poster_path ? `${TMDB_IMAGE_BASE}${tmdb.poster_path}` : "",
      });

      results.moviesCreated++;
      existingTitles.add(title.toLowerCase());

      // Create shows for each theater × each time slot × each day
      for (const theater of theaters) {
        for (const { date, screen, price } of showDates) {
          try {
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
            results.errors.push(`Show creation failed for ${title}: ${showErr.message}`);
          }
        }
      }
    } catch (movieErr) {
      results.errors.push(`Movie creation failed for ${title}: ${movieErr.message}`);
    }
  }

  console.log(`[TMDB SYNC] Done — ${results.moviesCreated} movies, ${results.showsCreated} shows created`);

  res.json({
    message: "TMDB sync complete",
    ...results,
  });
});