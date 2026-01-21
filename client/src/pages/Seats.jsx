import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import SeatGrid from "../components/SeatGrid";
import { useAuth } from "../context/AuthContext";

function Seats({ show, onBack }) {
  const { user } = useAuth();
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    if (loading) return;

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

  const confirmBooking = async () => {
    if (selectedSeats.length === 0) {
      setError("Please select at least one seat");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/bookings/confirm", {
        seatIds: selectedSeats,
        showId: show._id,
        totalAmount: selectedSeats.length * pricePerSeat,
      });

      alert("Booking confirmed! 🎉");
      setSelectedSeats([]);
      selectedSeatsRef.current = [];
      onBack();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Booking failed";
      setError(`${errorMsg}. Your locks may have expired. Please try again.`);
      setSelectedSeats([]);
      selectedSeatsRef.current = [];
      await fetchSeats();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    if (selectedSeats.length > 0) {
      await unlockSeats(selectedSeats);
    }
    setSelectedSeats([]);
    selectedSeatsRef.current = [];
    onBack();
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <button
        onClick={handleBack}
        style={{
          padding: "8px 16px",
          marginBottom: "24px",
          background: "#f5f5f5",
          border: "1px solid #ddd",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        ← Back to Shows
      </button>

      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h2 style={{ margin: "0 0 8px 0" }}>
          Select Seats - {show.theater?.name || show.screen}
        </h2>
        <p style={{ color: "#666", margin: "4px 0" }}>
          Show Time: {new Date(show.startTime).toLocaleString()}
        </p>
        <p style={{ color: "#666", margin: "4px 0" }}>
          Price per seat: ₹{pricePerSeat}
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "#ffebee",
            padding: "12px",
            marginBottom: "24px",
            borderRadius: "4px",
            color: "#c62828",
            textAlign: "center",
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
          gap: "24px",
          marginBottom: "24px",
          fontSize: "14px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              background: "#e0e0e0",
              borderRadius: "3px",
            }}
          ></div>
          <span>Available</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              background: "#1890ff",
              borderRadius: "3px",
            }}
          ></div>
          <span>Selected</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              background: "#faad14",
              borderRadius: "3px",
            }}
          ></div>
          <span>Locked by Others</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              background: "#ff4d4f",
              borderRadius: "3px",
            }}
          ></div>
          <span>Booked</span>
        </div>
      </div>

      {/* Screen */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <div
          style={{
            background: "linear-gradient(to bottom, #f0f0f0, #fff)",
            padding: "12px",
            borderRadius: "8px 8px 0 0",
            border: "2px solid #d0d0d0",
            borderBottom: "3px solid #999",
            maxWidth: "600px",
            margin: "0 auto",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: "bold",
              color: "#666",
            }}
          >
            🎬 SCREEN
          </p>
        </div>
      </div>

      {/* Seats Grid - Centered */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
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
          background: "#f5f5f5",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "16px",
            fontSize: "16px",
          }}
        >
          <span>
            <strong>Selected Seats:</strong>
          </span>
          <span>{selectedSeats.length} / 10</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#52c41a",
          }}
        >
          <span>Total Price:</span>
          <span>₹{selectedSeats.length * pricePerSeat}</span>
        </div>

        <button
          onClick={confirmBooking}
          disabled={loading || selectedSeats.length === 0}
          style={{
            width: "100%",
            padding: "14px",
            background: selectedSeats.length > 0 ? "#1890ff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: selectedSeats.length > 0 ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (selectedSeats.length > 0) {
              e.target.style.background = "#0050b3";
            }
          }}
          onMouseLeave={(e) => {
            if (selectedSeats.length > 0) {
              e.target.style.background = "#1890ff";
            }
          }}
        >
          {loading ? "Processing..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

export default Seats;