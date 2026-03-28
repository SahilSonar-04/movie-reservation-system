// ShowCard.jsx
import styles from './ShowCard.module.css';

function ShowCard({ show, onSelect }) {
  const showDate = new Date(show.startTime);
  const isPast = showDate < new Date();

  const formattedDate = showDate.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
  const formattedTime = showDate.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      className={`${styles.card} ${isPast ? styles.cardPast : ""}`}
      onClick={() => !isPast && onSelect && onSelect(show)}
    >
      <div className={styles.top}>
        <p className={styles.screen}>{show.screen}</p>
        <div className={`${styles.price} ${isPast ? styles.pricePast : ""}`}>
          ₹{show.price}
        </div>
      </div>

      <div className={styles.date}>{formattedDate}</div>

      <div className={`${styles.time} ${isPast ? styles.timePast : ""}`}>
        {formattedTime}
      </div>

      {isPast && (
        <span className={styles.endedBadge}>Show Ended</span>
      )}
    </div>
  );
}

export default ShowCard;