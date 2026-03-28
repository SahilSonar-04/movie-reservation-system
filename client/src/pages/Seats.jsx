// Seats.jsx
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { io } from "socket.io-client";
import api from "../services/api";
import SeatGrid from "../components/SeatGrid";
import CheckoutForm from "../components/CheckoutForm";
import BookingTicket from "../components/BookingTicket";
import { useAuth } from "../context/AuthContext";
import { stripePromise } from "../config/stripe.config";
import { LOCK_TIME_MS } from "../config/lock.config";
import styles from "./Seats.module.css";

function useLockCountdown(lockStartTime, isActive) {
  const [timeLeft, setTimeLeft] = useState(null);
  useEffect(() => {
    if (!isActive || !lockStartTime) { setTimeLeft(null); return; }
    const tick = () => {
      const elapsed = Date.now() - lockStartTime;
      setTimeLeft(Math.max(0, LOCK_TIME_MS - elapsed));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockStartTime, isActive]);
  return timeLeft;
}

function formatCountdown(ms) {
  if (ms === null) return null;
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function LoginPromptModal({ onClose }) {
  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalIcon}>
          <svg width="24" height="24" fill="none" stroke="#e63030" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className={styles.modalTitle}>Sign in to book</h2>
        <p className={styles.modalText}>
          Create a free account or sign in to select seats and complete your booking.
        </p>
        <div className={styles.modalBtns}>
          <Link to="/login" className={styles.modalSignIn}>Sign In</Link>
          <Link to="/register" className={styles.modalSignUp}>Create Free Account</Link>
          <button className={styles.modalDismiss} onClick={onClose}>Continue Browsing</button>
        </div>
      </div>
    </div>
  );
}

function Seats({ show, onBack }) {
  const { user } = useAuth();
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);
  const [lockStartTime, setLockStartTime] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const selectedSeatsRef = useRef([]);
  const socketRef = useRef(null);
  const pricePerSeat = show.price;

  const timeLeft = useLockCountdown(lockStartTime, selectedSeats.length > 0 && !showPayment);
  const isExpiringSoon = timeLeft !== null && timeLeft < 60000;

  useEffect(() => { selectedSeatsRef.current = selectedSeats; }, [selectedSeats]);
  useEffect(() => { if (selectedSeats.length === 0) setLockStartTime(null); }, [selectedSeats]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000", {
      transports: ["websocket"],
      withCredentials: true,
    });
    socketRef.current = socket;
    socket.on("connect", () => { setSocketConnected(true); socket.emit("join:show", show._id); });
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("seats:updated", (updatedSeats) => setSeats(updatedSeats));
    return () => { socket.emit("leave:show", show._id); socket.disconnect(); };
  }, [show._id]);

  const fetchSeats = async () => {
    try {
      const res = await api.get(`/seats/${show._id}`);
      setSeats(res.data);

      // ── Restore locked seats after a page refresh ──────────────────────
      // On refresh selectedSeats resets to []. Find any seats the current
      // user already has locked in the DB and restore them so they show as
      // "selected" and remain interactive instead of "locked by other user".
      if (user) {
        const myLocked = res.data.filter(
          (s) =>
            s.status === "LOCKED" &&
            s.lockedBy?.toString() === user._id?.toString()
        );
        if (myLocked.length > 0) {
          const ids = myLocked.map((s) => s._id);
          setSelectedSeats(ids);
          selectedSeatsRef.current = ids;

          // Restore the countdown from the original lockedAt timestamp so
          // the timer is accurate rather than resetting to 5 minutes.
          const earliestLockedAt = Math.min(
            ...myLocked.map((s) => new Date(s.lockedAt).getTime())
          );
          setLockStartTime(earliestLockedAt);
        }
      }
    } catch {}
  };

  useEffect(() => { fetchSeats(); }, [show._id]);

  useEffect(() => {
    return () => {
      const toUnlock = selectedSeatsRef.current;
      if (toUnlock.length > 0) api.post("/seats/unlock", { seatIds: toUnlock }).catch(() => {});
    };
  }, []);

  const unlockSeats = async (seatIds) => {
    if (seatIds.length === 0) return;
    try { await api.post("/seats/unlock", { seatIds }); } catch {}
  };

  const toggleSeat = async (seat) => {
    if (!user) { setShowLoginPrompt(true); return; }
    if (loading || showPayment) return;

    const isSelected    = selectedSeats.includes(seat._id);
    // A seat can be locked by this user but not yet in selectedSeats (e.g.
    // after a page refresh). Treat that the same as "selected".
    const isLockedByMe  = seat.lockedBy?.toString() === user._id?.toString();

    if (seat.status === "BOOKED") {
      setError("This seat is already booked");
      return;
    }
    // Only block if locked by SOMEONE ELSE — not by the current user.
    if (seat.status === "LOCKED" && !isSelected && !isLockedByMe) {
      setError("This seat is locked by another user");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (isSelected || isLockedByMe) {
        // Deselect / unlock
        await unlockSeats([seat._id]);
        setSelectedSeats((prev) => prev.filter((id) => id !== seat._id));
      } else {
        // Lock and select
        await api.post("/seats/lock", { seatIds: [seat._id] });
        setSelectedSeats((prev) => [...prev, seat._id]);
        if (selectedSeats.length === 0) setLockStartTime(Date.now());
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to lock/unlock seat");
      await fetchSeats();
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!user) { setShowLoginPrompt(true); return; }
    if (selectedSeats.length === 0) { setError("Please select at least one seat"); return; }
    if (lockStartTime && Date.now() - lockStartTime >= LOCK_TIME_MS) {
      setError("Your seat locks have expired. Please re-select your seats.");
      setSelectedSeats([]);
      selectedSeatsRef.current = [];
      setLockStartTime(null);
      await fetchSeats();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/payments/create-payment-intent", {
        seatIds: selectedSeats,
        showId: show._id,
      });
      setClientSecret(res.data.clientSecret);
      setShowPayment(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to initiate payment");
      setSelectedSeats([]);
      selectedSeatsRef.current = [];
      setLockStartTime(null);
      await fetchSeats();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (booking) => {
    setShowPayment(false);
    setSelectedSeats([]);
    selectedSeatsRef.current = [];
    setLockStartTime(null);
    setCompletedBooking(booking);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setClientSecret("");
  };

  const handleBack = async () => {
    if (selectedSeats.length > 0 && !showPayment) await unlockSeats(selectedSeats);
    setSelectedSeats([]);
    selectedSeatsRef.current = [];
    setLockStartTime(null);
    onBack();
  };

  const showDate = new Date(show.startTime);
  const totalAmount = selectedSeats.length * pricePerSeat;

  /* ── Completed booking ticket ── */
  if (completedBooking) {
    return (
      <BookingTicket
        booking={completedBooking}
        onClose={() => { setCompletedBooking(null); onBack(); }}
      />
    );
  }

  /* ── Payment view ── */
  if (showPayment && clientSecret) {
    return (
      <div className={styles.paymentWrap}>
        <div className={styles.paymentHeader}>
          <h1 className={styles.paymentTitle}>Complete Payment</h1>
          <p className={styles.paymentSubtitle}>
            {show.movie?.title} · {show.theater?.name}
          </p>
        </div>
        <div className={styles.paymentCard}>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  colorPrimary: "#e63030",
                  colorBackground: "#16161f",
                  colorText: "#f0f0f5",
                  colorDanger: "#f87171",
                  fontFamily: "DM Sans, sans-serif",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <CheckoutForm
              amount={totalAmount}
              seatCount={selectedSeats.length}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </Elements>
        </div>
        <div className={styles.paymentNote}>
          Your seats are locked for 5 minutes while you complete payment.
        </div>
      </div>
    );
  }

  /* ── Main seat picker ── */
  return (
    <div className={styles.page}>
      {showLoginPrompt && <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />}

      {/* Back */}
      <button
        className={`${styles.backBtn} ${showPayment ? styles.backBtnDisabled : ""}`}
        onClick={handleBack}
        disabled={showPayment}
      >
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Shows
      </button>

      {/* Show info */}
      <div className={styles.infoCard}>
        <div>
          <h1 className={styles.infoTitle}>Select Your Seats</h1>
          <div className={styles.infoMeta}>
            <span>
              <span className={styles.infoMetaLabel}>Theater</span>
              {show.theater?.name || show.screen}
            </span>
            <span>
              <span className={styles.infoMetaLabel}>Show</span>
              {showDate.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
            <span>
              <span className={styles.infoMetaLabel}>Price</span>
              ₹{pricePerSeat} / seat
            </span>
          </div>
        </div>
        <div className={styles.liveIndicator}>
          <span className={`${styles.liveDot} ${socketConnected ? styles.liveDotConnected : ""}`} />
          <span className={socketConnected ? styles.liveTextConnected : styles.liveText}>
            {socketConnected ? "Live" : "Connecting…"}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendSwatch} style={{ background: "#2a2a3a", border: "1.5px solid #3a3a50" }} />
          Available
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendSwatch} style={{ background: "#e63030", border: "1.5px solid #ff5555" }} />
          Selected
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendSwatch} style={{ background: "#2a2010", border: "1.5px solid #f59e0b" }} />
          Held
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendSwatch} style={{ background: "#1a1a2a", border: "1.5px solid #2a2a3a", opacity: 0.5 }} />
          Booked
        </div>
      </div>

      {/* Guest banner */}
      {!user && (
        <div className={styles.guestBanner}>
          <span className={styles.guestBannerText}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Browsing as guest — sign in to book seats
          </span>
          <div className={styles.guestBannerBtns}>
            <Link to="/login" className={styles.guestSignIn}>Sign In</Link>
            <Link to="/register" className={styles.guestSignUp}>Sign Up</Link>
          </div>
        </div>
      )}

      {/* Screen */}
      <div className={styles.screenWrap}>
        <div className={styles.screen}>
          <p className={styles.screenText}>Screen This Way</p>
        </div>
      </div>

      {/* Seat grid */}
      <div className={styles.gridWrap}>
        {loading && <div className={styles.loadingOverlay} />}
        <SeatGrid
          seats={seats}
          selectedSeats={selectedSeats}
          onSeatClick={toggleSeat}
          userId={user?._id}
        />
      </div>

      {/* Booking bar */}
      <div className={`${styles.bookingBar} ${isExpiringSoon ? styles.bookingBarUrgent : ""}`}>
        <div className={`${styles.bookingBarTop} ${!user ? styles.bookingBarTopNoBottom : ""}`}>
          <div>
            {user ? (
              <>
                <div className={styles.seatCount}>
                  {selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""} selected · max 10
                </div>
                <div className={styles.totalAmount}>
                  ₹{totalAmount}
                </div>
              </>
            ) : (
              <div className={styles.guestPrompt}>Sign in to select seats and book tickets</div>
            )}
          </div>

          {user ? (
            <button
              className={styles.payBtn}
              onClick={initiatePayment}
              disabled={loading || selectedSeats.length === 0}
            >
              {loading ? "Processing…" : "Proceed to Payment"}
            </button>
          ) : (
            <button className={styles.signInBtn} onClick={() => setShowLoginPrompt(true)}>
              Sign In to Book
            </button>
          )}
        </div>

        {/* Countdown */}
        {user && selectedSeats.length > 0 && timeLeft !== null && (
          <div className={`${styles.countdown} ${isExpiringSoon ? styles.countdownUrgent : ""}`}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isExpiringSoon
              ? <span><strong>Hurry!</strong> Locks expire in <strong>{formatCountdown(timeLeft)}</strong></span>
              : <span>Seats held for <strong>{formatCountdown(timeLeft)}</strong></span>
            }
          </div>
        )}

        {user && selectedSeats.length === 0 && (
          <p className={styles.hintText}>Select seats above to proceed</p>
        )}
      </div>
    </div>
  );
}

export default Seats;