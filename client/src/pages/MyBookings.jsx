import { useEffect, useState } from "react";
import api from "../services/api";
import styles from "./MyBookings.module.css";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");

  const fetchBookings = async () => {
    try {
      setError("");
      const res = await api.get("/bookings/my");
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings", err);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.patch(`/bookings/cancel/${bookingId}`);
      alert("Booking cancelled successfully");
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading your bookings…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrap}>
        <div className={styles.errorBox}>{error}</div>
        <button className={styles.retryBtn} onClick={fetchBookings}>Retry</button>
      </div>
    );
  }

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" && b.show && new Date(b.show.startTime) > now
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "CANCELLED" || !b.show || new Date(b.show.startTime) <= now
  );
  const displayedBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  if (bookings.length === 0) {
    return (
      <div className={styles.emptyPage}>
        <div className={styles.emptyIconWrap}>🎫</div>
        <h2 className={styles.emptyTitle}>No Bookings Yet</h2>
        <p className={styles.emptyText}>Book your first movie to see it here!</p>
      </div>
    );
  }

  const paymentClass = (status) => {
    if (status === "PAID")     return styles.paymentPaid;
    if (status === "REFUNDED") return styles.paymentRefunded;
    if (status === "FAILED")   return styles.paymentFailed;
    return styles.paymentPending;
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.heading}>My Bookings</h1>
        <p className={styles.subheading}>
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} total
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { key: "upcoming", label: "Upcoming",          count: upcomingBookings.length },
          { key: "past",     label: "Past & Cancelled",  count: pastBookings.length },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className={styles.tabBadge}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Empty tab state */}
      {displayedBookings.length === 0 && (
        <div className={styles.emptyTab}>
          <div className={styles.emptyTabIcon}>
            {activeTab === "upcoming" ? "🎬" : "📁"}
          </div>
          <h3 className={styles.emptyTabTitle}>
            {activeTab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
          </h3>
          <p className={styles.emptyTabText}>
            {activeTab === "upcoming"
              ? "Book a movie to see your upcoming shows here."
              : "Your completed and cancelled bookings will appear here."}
          </p>
        </div>
      )}

      {/* Booking list */}
      <div className={styles.list}>
        {displayedBookings.map((b, idx) => {
          const isConfirmed = b.status === "CONFIRMED";
          const showDate    = b.show?.startTime ? new Date(b.show.startTime) : new Date(b.createdAt);
          const isPastShow  = !b.show || showDate < now;

          return (
            <div
              key={b._id}
              className={`${styles.card} ${isPastShow || !isConfirmed ? styles.cardDimmed : ""}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Card header */}
              <div className={`${styles.cardHeader} ${isConfirmed && !isPastShow ? styles.cardHeaderConfirmed : ""}`}>
                <h3 className={styles.movieTitle}>{b.show?.movie?.title || "Movie Show"}</h3>
                <div className={styles.badges}>
                  <span className={`${styles.statusBadge} ${isConfirmed ? styles.statusConfirmed : styles.statusCancelled}`}>
                    {b.status}
                  </span>
                  {b.paymentStatus && (
                    <span className={`${styles.paymentBadge} ${paymentClass(b.paymentStatus)}`}>
                      {b.paymentStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className={styles.cardBody}>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Theater</div>
                    <div className={styles.detailValue}>{b.show?.theater?.name || "Theater"}</div>
                    <div className={styles.detailSub}>{b.show?.screen || "Screen"}</div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Show Time</div>
                    <div className={styles.detailValue}>
                      {showDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className={styles.detailSub}>
                      {showDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Seats</div>
                    <div className={styles.seatChips}>
                      {b.seats.map((s) => (
                        <span key={s._id} className={styles.seatChip}>{s.seatNumber}</span>
                      ))}
                    </div>
                    <div className={styles.detailSub}>
                      {b.seats.length} {b.seats.length === 1 ? "seat" : "seats"}
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Total Amount</div>
                    <div className={styles.totalAmount}>₹{b.totalAmount}</div>
                  </div>
                </div>

                <div className={styles.cardDivider} />

                <p className={styles.bookingMeta}>
                  Booked on{" "}
                  {new Date(b.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>

                <div className={styles.actionRow}>
                  {isConfirmed && !isPastShow && (
                    <button className={styles.cancelBtn} onClick={() => cancelBooking(b._id)}>
                      Cancel Booking
                    </button>
                  )}
                  {isPastShow && isConfirmed && (
                    <div className={styles.pastNotice}>This show has already ended</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MyBookings;