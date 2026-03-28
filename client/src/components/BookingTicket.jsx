import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import styles from "./BookingTicket.module.css";

function BookingTicket({ booking, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !booking._id) return;

    QRCode.toCanvas(canvas, booking._id, {
      width: 112,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).catch((err) => console.error("QR generation failed:", err));
  }, [booking._id]);

  const show        = booking.show;
  const showDate    = new Date(show.startTime);
  const bookingDate = new Date(booking.createdAt);

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.ticket}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <p className={styles.brand}>CineBook Ticket</p>
              <h2 className={styles.movieTitle}>{show.movie.title}</h2>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
          </div>

          <div>
            <span className={styles.confirmedBadge}>✓ Confirmed</span>
          </div>

          {/* Tear line */}
          <div className={styles.tearLine}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className={styles.tearPiece} />
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* Details grid */}
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Date</div>
              <div className={styles.detailValue}>
                {showDate.toLocaleDateString("en-US", {
                  weekday: "short", month: "long", day: "numeric", year: "numeric",
                })}
              </div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Time</div>
              <div className={styles.detailValue}>
                {showDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Theater</div>
              <div className={styles.detailValue}>{show.theater.name}</div>
              <div className={styles.detailSub}>{show.theater.location}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Screen</div>
              <div className={styles.detailValue}>{show.screen}</div>
            </div>
          </div>

          {/* Seats */}
          <div className={styles.seatsBox}>
            <div className={styles.seatsLabel}>Seats</div>
            <div className={styles.seatChips}>
              {booking.seats.map((seat) => (
                <span key={seat._id} className={styles.seatChip}>
                  {seat.seatNumber}
                </span>
              ))}
            </div>
            <div className={styles.seatsMeta}>
              {booking.seats.length} {booking.seats.length === 1 ? "seat" : "seats"} ·{" "}
              <span className={styles.totalAmount}>₹{booking.totalAmount}</span>
            </div>
          </div>

          {/* QR + Booking ID */}
          <div className={styles.qrBox}>
            <canvas
              ref={canvasRef}
              className={styles.qrCanvas}
            />
            <div className={styles.qrInfo}>
              <div className={styles.bookingIdLabel}>Booking ID</div>
              <div className={styles.bookingId}>{booking._id}</div>
              <div className={styles.bookedOn}>
                Booked on{" "}
                {bookingDate.toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.printBtn} onClick={() => window.print()}>
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Ticket
            </button>
            <button className={styles.closeActionBtn} onClick={onClose}>
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default BookingTicket;