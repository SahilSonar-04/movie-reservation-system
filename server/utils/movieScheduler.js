import { syncMovies, setNextSyncTime } from "../services/movieSync.service.js";
import logger from "./logger.js";

let schedulerInterval = null;

/**
 * Initialize the periodic movie sync & cleanup scheduler
 */
export const initMovieScheduler = () => {
  const intervalHours = parseInt(process.env.TMDB_SYNC_INTERVAL_HOURS, 10) || 12;
  const intervalMs = intervalHours * 60 * 60 * 1000;

  logger.info(`[MovieScheduler] Initialized — configured to run every ${intervalHours} hour(s)`);

  // Set initial next sync time
  setNextSyncTime(new Date(Date.now() + 10000));

  // Run initial sync shortly after startup (10s delay to ensure DB and socket are ready)
  const initialTimeout = setTimeout(async () => {
    if (!process.env.TMDB_ACCESS_TOKEN) {
      logger.warn("[MovieScheduler] TMDB_ACCESS_TOKEN not set in environment. Auto-sync will be skipped until configured.");
      setNextSyncTime(new Date(Date.now() + intervalMs));
      return;
    }

    try {
      logger.info("[MovieScheduler] Running startup movie sync & maintenance...");
      await syncMovies();
    } catch (err) {
      logger.error(`[MovieScheduler] Startup sync error: ${err.message}`);
    }
  }, 10000);

  // Periodic interval
  schedulerInterval = setInterval(async () => {
    if (!process.env.TMDB_ACCESS_TOKEN) {
      logger.warn("[MovieScheduler] TMDB_ACCESS_TOKEN not set. Skipping scheduled sync.");
      setNextSyncTime(new Date(Date.now() + intervalMs));
      return;
    }

    try {
      logger.info("[MovieScheduler] Triggering scheduled movie sync & maintenance...");
      await syncMovies();
    } catch (err) {
      logger.error(`[MovieScheduler] Scheduled sync error: ${err.message}`);
    }
  }, intervalMs);

  return {
    clear: () => {
      clearTimeout(initialTimeout);
      if (schedulerInterval) clearInterval(schedulerInterval);
    },
  };
};

export default initMovieScheduler;
