import { useEffect, useState } from "react";
import api from "../services/api";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    try {
      setError("");
      const res = await api.get("/bookings/my");
      // ✅ FIX: Access bookings property from response
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
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );
    if (!confirmCancel) return;

    try {
      await api.patch(`/bookings/cancel/${bookingId}`);
      alert("Booking cancelled successfully");
      fetchBookings(); // Refresh list
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Failed to cancel booking";
      alert(message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <div
          style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
        <button
          onClick={fetchBookings}
          style={{ marginTop: "16px", padding: "8px 16px" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p>No bookings found.</p>
        <p style={{ marginTop: "8px", color: "#666" }}>
          Book your first movie to see it here!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>My Bookings</h2>

      {bookings.map((b) => (
        <div
          key={b._id}
          style={{
            border: "1px solid #ddd",
            padding: "16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0" }}>{b.show.movie.title}</h3>

          <div style={{ marginBottom: "8px" }}>
            <p style={{ margin: "4px 0" }}>
              <strong>Theater:</strong> {b.show.theater.name}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Screen:</strong> {b.show.screen}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Show Time:</strong>{" "}
              {new Date(b.show.startTime).toLocaleString()}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Seats:</strong>{" "}
              {b.seats.map((s) => s.seatNumber).join(", ")}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Total Amount:</strong> ₹{b.totalAmount}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Booking Date:</strong>{" "}
              {new Date(b.createdAt).toLocaleString()}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color: b.status === "CONFIRMED" ? "#52c41a" : "#f5222d",
                  fontWeight: "bold",
                }}
              >
                {b.status}
              </span>
            </p>
          </div>

          {b.status === "CONFIRMED" && (
            <button
              onClick={() => cancelBooking(b._id)}
              style={{
                padding: "8px 16px",
                marginTop: "8px",
                background: "#ff4d4f",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel Booking
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default MyBookings;