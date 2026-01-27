import { useEffect, useState, useRef } from "react";
import { Elements } from "@stripe/react-stripe-js";
import api from "../services/api";
import SeatGrid from "../components/SeatGrid";
import CheckoutForm from "../components/CheckoutForm";
import { useAuth } from "../context/AuthContext";
import { stripePromise } from "../config/stripe.config";

function Seats({ show, onBack }) {
  const { user } = useAuth();
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const selectedSeatsRef = useRef([]);
  const pricePerSeat = show.price;

  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  const fetchSeats = async () => {
    try {
      const res = await api.get(`/seats/${show._id}`);
      setSeats(res.data);
    } catch (err) {
      console.error("Failed to fetch seats", err);
    }
  };

  useEffect(() => {
    fetchSeats();
    const interval = setInterval(fetchSeats, 2000);
    return () => clearInterval(interval);
  }, [show._id]);

  useEffect(() => {
    return () => {
      const seatsToUnlock = selectedSeatsRef.current;
      if (seatsToUnlock.length > 0) {
        api.post("/seats/unlock", { seatIds: seatsToUnlock }).catch(() => {});
      }
    };
  }, []);

  const unlockSeats = async (seatIds) => {
    if (seatIds.length === 0) return;
    try {
      await api.post("/seats/unlock", { seatIds });
    } catch (err) {
      console.error("Failed to unlock", err);
    }
  };

  const toggleSeat = async (seat) => {
    if (loading || showPayment) return;

    const isSelected = selectedSeats.includes(seat._id);

    if (seat.status === "BOOKED") {
      setError("This seat is already booked");
      return;
    }

    if (seat.status === "LOCKED" && !isSelected) {
      setError("This seat is locked by another user");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isSelected) {
        await unlockSeats([seat._id]);
        setSelectedSeats((prev) => prev.filter((id) => id !== seat._id));
      } else {
        await api.post("/seats/lock", { seatIds: [seat._id] });
        setSelectedSeats((prev) => [...prev, seat._id]);
      }

      await fetchSeats();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to lock/unlock seat";
      setError(errorMsg);
      await fetchSeats();
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (selectedSeats.length === 0) {
      setError("Please select at least one seat");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create payment intent
      const response = await api.post("/payments/create-payment-intent", {
        seatIds: selectedSeats,
        showId: show._id,
      });

      setClientSecret(response.data.clientSecret);
      setPaymentIntentId(response.data.paymentIntentId);
      setShowPayment(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to initiate payment";
      setError(errorMsg);
      setSelectedSeats([]);
      selectedSeatsRef.current = [];
      await fetchSeats();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (booking) => {
    setShowPayment(false);
    setSelectedSeats([]);
    selectedSeatsRef.current = [];
    alert("Booking confirmed successfully! Payment completed.");
    onBack();
  };

  const handlePaymentCancel = async () => {
    setShowPayment(false);
    setClientSecret("");
    setPaymentIntentId("");
    // Keep seats locked, user can try payment again
  };

  const handleBack = async () => {
    if (selectedSeats.length > 0 && !showPayment) {
      await unlockSeats(selectedSeats);
    }
    setSelectedSeats([]);
    selectedSeatsRef.current = [];
    onBack();
  };

  const showDate = new Date(show.startTime);
  const totalAmount = selectedSeats.length * pricePerSeat;

  // Payment Modal
  if (showPayment && clientSecret) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h1 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700", color: "#111827" }}>
            Complete Payment
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            {show.movie?.title} at {show.theater?.name}
          </p>
        </div>

        {/* Stripe Payment Form */}
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#dc2626",
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

        {/* Security Notice */}
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#166534",
          }}
        >
          <strong>Your seats are locked</strong> for the next 5 minutes while you complete payment.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Back Button */}
      <button
        onClick={handleBack}
        disabled={showPayment}
        style={{
          padding: "10px 20px",
          marginBottom: "24px",
          background: "transparent",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          cursor: showPayment ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "500",
          color: "#6b7280",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.2s",
          opacity: showPayment ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!showPayment) {
            e.target.style.borderColor = "#dc2626";
            e.target.style.color = "#dc2626";
          }
        }}
        onMouseLeave={(e) => {
          if (!showPayment) {
            e.target.style.borderColor = "#e5e7eb";
            e.target.style.color = "#6b7280";
          }
        }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Shows
      </button>

      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          marginBottom: "32px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1 style={{ margin: "0 0 16px 0", fontSize: "28px", fontWeight: "700", color: "#111827" }}>
          Select Your Seats
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", color: "#6b7280", fontSize: "14px" }}>
          <div>
            <span style={{ fontWeight: "600", color: "#111827" }}>Theater:</span>{" "}
            {show.theater?.name || show.screen}
          </div>
          <div>
            <span style={{ fontWeight: "600", color: "#111827" }}>Show:</span>{" "}
            {showDate.toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div>
            <span style={{ fontWeight: "600", color: "#111827" }}>Price:</span>{" "}
            ₹{pricePerSeat} per seat
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "24px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "32px",
          marginBottom: "32px",
          fontSize: "13px",
          flexWrap: "wrap",
          padding: "16px",
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              background: "#f3f4f6",
              border: "2px solid #d1d5db",
              borderRadius: "4px",
            }}
          />
          <span style={{ color: "#4b5563" }}>Available</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              background: "#dc2626",
              border: "2px solid #b91c1c",
              borderRadius: "4px",
            }}
          />
          <span style={{ color: "#4b5563" }}>Selected</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              background: "#fef3c7",
              border: "2px solid #fde047",
              borderRadius: "4px",
            }}
          />
          <span style={{ color: "#4b5563" }}>Locked</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              background: "#fee2e2",
              border: "2px solid #fca5a5",
              borderRadius: "4px",
            }}
          />
          <span style={{ color: "#4b5563" }}>Booked</span>
        </div>
      </div>

      {/* Screen */}
      <div style={{ marginBottom: "48px", textAlign: "center" }}>
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            padding: "16px",
            background: "linear-gradient(180deg, #f9fafb 0%, #fff 100%)",
            border: "2px solid #e5e7eb",
            borderBottom: "4px solid #9ca3af",
            borderRadius: "12px 12px 0 0",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: "600",
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Screen This Way
          </p>
        </div>
      </div>

      {/* Seats Grid */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "48px" }}>
        <SeatGrid
          seats={seats}
          selectedSeats={selectedSeats}
          onSeatClick={toggleSeat}
          userId={user?._id}
        />
      </div>

      {/* Booking Summary */}
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          position: "sticky",
          bottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
              Selected Seats: {selectedSeats.length} / 10
            </div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#111827" }}>
              Total: ₹{totalAmount}
            </div>
          </div>

          <button
            onClick={initiatePayment}
            disabled={loading || selectedSeats.length === 0}
            style={{
              padding: "14px 32px",
              background: selectedSeats.length > 0 ? "#dc2626" : "#d1d5db",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: selectedSeats.length > 0 ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: selectedSeats.length > 0 ? "0 2px 8px rgba(220, 38, 38, 0.3)" : "none",
            }}
            onMouseEnter={(e) => {
              if (selectedSeats.length > 0 && !loading) {
                e.target.style.background = "#b91c1c";
                e.target.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedSeats.length > 0 && !loading) {
                e.target.style.background = "#dc2626";
                e.target.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "Processing..." : "Proceed to Payment"}
          </button>
        </div>

        {selectedSeats.length > 0 && (
          <div style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
            Seats will be locked for 5 minutes during payment
          </div>
        )}
      </div>
    </div>
  );
}

export default Seats;