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
      fetchBookings();
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Failed to cancel booking";
      alert(message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid #f3f4f6",
            borderTopColor: "#dc2626",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading your bookings...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "600px", margin: "80px auto", padding: "0 20px" }}>
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
        <button
          onClick={fetchBookings}
          style={{
            padding: "10px 20px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "#f3f4f6",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "36px",
          }}
        >
          🎫
        </div>
        <h2 style={{ color: "#111827", marginBottom: "8px" }}>No Bookings Yet</h2>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          Book your first movie to see it here!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "700", color: "#111827" }}>
          My Bookings
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "15px" }}>
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} total
        </p>
      </div>

      {/* Bookings List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {bookings.map((b) => {
          const isConfirmed = b.status === "CONFIRMED";
          const showDate = new Date(b.show.startTime);
          const isPastShow = showDate < new Date();

          return (
            <div
              key={b._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Booking Header */}
              <div
                style={{
                  background: isConfirmed ? "#fef2f2" : "#f3f4f6",
                  padding: "16px 24px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#111827" }}>
                  {b.show.movie.title}
                </h3>
                <span
                  style={{
                    padding: "6px 12px",
                    background: isConfirmed ? "#dcfce7" : "#fee2e2",
                    color: isConfirmed ? "#166534" : "#991b1b",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {b.status}
                </span>
              </div>

              {/* Booking Details */}
              <div style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >
                  {/* Theater Info */}
                  <div>
                    <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px", fontWeight: "500", textTransform: "uppercase" }}>
                      Theater
                    </div>
                    <div style={{ fontSize: "15px", color: "#111827", fontWeight: "500" }}>
                      {b.show.theater.name}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      {b.show.screen}
                    </div>
                  </div>

                  {/* Show Time */}
                  <div>
                    <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px", fontWeight: "500", textTransform: "uppercase" }}>
                      Show Time
                    </div>
                    <div style={{ fontSize: "15px", color: "#111827", fontWeight: "500" }}>
                      {showDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      {showDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Seats */}
                  <div>
                    <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px", fontWeight: "500", textTransform: "uppercase" }}>
                      Seats
                    </div>
                    <div style={{ fontSize: "15px", color: "#111827", fontWeight: "500" }}>
                      {b.seats.map((s) => s.seatNumber).join(", ")}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      {b.seats.length} {b.seats.length === 1 ? "seat" : "seats"}
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px", fontWeight: "500", textTransform: "uppercase" }}>
                      Total Amount
                    </div>
                    <div style={{ fontSize: "20px", color: "#dc2626", fontWeight: "700" }}>
                      ₹{b.totalAmount}
                    </div>
                  </div>
                </div>

                {/* Booking Date */}
                <div
                  style={{
                    fontSize: "13px",
                    color: "#9ca3af",
                    paddingTop: "16px",
                    borderTop: "1px solid #f3f4f6",
                  }}
                >
                  Booked on {new Date(b.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {/* Cancel Button */}
                {isConfirmed && !isPastShow && (
                  <button
                    onClick={() => cancelBooking(b._id)}
                    style={{
                      marginTop: "20px",
                      padding: "10px 20px",
                      background: "transparent",
                      color: "#dc2626",
                      border: "1px solid #dc2626",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#dc2626";
                      e.target.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.color = "#dc2626";
                    }}
                  >
                    Cancel Booking
                  </button>
                )}

                {isPastShow && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "12px",
                      background: "#f3f4f6",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#6b7280",
                      textAlign: "center",
                    }}
                  >
                    This show has already ended
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MyBookings;