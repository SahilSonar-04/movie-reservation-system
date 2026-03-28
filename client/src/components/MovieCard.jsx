// MovieCard.jsx
import styles from './MovieCard.module.css';

// Skeleton shown while movies load
export function MovieCardSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonPoster} />
      <div className={styles.skeletonInfo}>
        <div className={styles.skeletonLine} style={{ width: '80%' }} />
        <div className={styles.skeletonLine} style={{ width: '50%' }} />
      </div>
    </div>
  );
}

function MovieCard({ movie, onSelect }) {
  const primaryGenres = movie.genre?.slice(0, 2) ?? [];

  return (
    <div className={styles.card} onClick={() => onSelect(movie)}>

      {/* ── Poster ── */}
      <div className={styles.posterWrap}>
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className={styles.poster}
            loading="lazy"
          />
        ) : (
          <div className={styles.posterFallback}>
            <span className={styles.posterFallbackLetter}>
              {movie.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Genre badges */}
        {primaryGenres.length > 0 && (
          <div className={styles.genreBadge}>
            {primaryGenres.map((g) => (
              <span key={g} className={styles.badge}>{g}</span>
            ))}
          </div>
        )}

        {/* Bottom gradient */}
        <div className={styles.posterGradient} />
      </div>

      {/* ── Info ── */}
      <div className={styles.info}>
        <h3 className={styles.title}>{movie.title}</h3>

        <div className={styles.meta}>
          {movie.duration && (
            <span className={styles.metaItem}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {movie.duration}m
            </span>
          )}

          {movie.duration && movie.language && (
            <span className={styles.metaDot} />
          )}

          {movie.language && (
            <span className={styles.metaItem}>{movie.language}</span>
          )}
        </div>
      </div>

      {/* ── Book bar (slides up on hover) ── */}
      <div className={styles.bookBar}>
        <span className={styles.bookBarText}>Book Tickets</span>
        <span className={styles.bookBarArrow}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>

    </div>
  );
}

export default MovieCard;