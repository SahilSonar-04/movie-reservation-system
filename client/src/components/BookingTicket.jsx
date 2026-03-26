import { useEffect, useRef } from "react";
import QRCode from "qrcode";

/**
 * BookingTicket - Renders a printable/shareable ticket with QR code.
 * Shows booking details and a QR code containing the booking ID.
 */
function BookingTicket({ booking, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !booking._id) return;

    QRCode.toCanvas(canvas, booking._id, {
      width: 120,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    }).catch((err) => console.error("QR generation failed:", err));
  }, [booking._id]);

  const show = booking.show;
  const showDate = new Date(show.startTime);
  const bookingDate = new Date(booking.createdAt);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 25px 80px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Ticket Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
            padding: "28px 32px",
            color: "#fff",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.8, marginBottom: "6px" }}>
                CineBook Ticket
              </div>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", lineHeight: "1.2" }}>
                {show.movie.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "#fff",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Booking status badge */}
          <div style={{ marginTop: "16px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: "rgba(255,255,255,0.25)",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              ✓ CONFIRMED
            </span>
          </div>

          {/* Ticket tear line */}
          <div
            style={{
              position: "absolute",
              bottom: "-12px",
              left: 0,
              right: 0,
              height: "24px",
              display: "flex",
              overflow: "hidden",
            }}
          >
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: "#fff",
                  borderRadius: "0 0 50% 50%",
                  margin: "0 1px",
                }}
              />
            ))}
          </div>
        </div>

        {/* Ticket Body */}
        <div style={{ padding: "32px 32px 24px" }}>
          {/* Main details grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Date</div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}>
                {showDate.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Time</div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}>
                {showDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Theater</div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}>{show.theater.name}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>{show.theater.location}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Screen</div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}>{show.screen}</div>
            </div>
          </div>

          {/* Seats */}
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Seats</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {booking.seats.map((seat) => (
                <span
                  key={seat._id}
                  style={{
                    padding: "4px 12px",
                    background: "#dc2626",
                    color: "#fff",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {seat.seatNumber}
                </span>
              ))}
            </div>
            <div style={{ marginTop: "8px", fontSize: "13px", color: "#374151" }}>
              {booking.seats.length} {booking.seats.length === 1 ? "seat" : "seats"} • <span style={{ fontWeight: "700", color: "#dc2626" }}>₹{booking.totalAmount}</span>
            </div>
          </div>

          {/* QR + Booking ID */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "16px",
              background: "#f9fafb",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              marginBottom: "20px",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ border: "4px solid #fff", borderRadius: "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Booking ID</div>
              <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#111827", wordBreak: "break-all", fontWeight: "600" }}>
                {booking._id}
              </div>
              <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>
                Booked on {bookingDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handlePrint}
              style={{
                flex: 1,
                padding: "11px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Ticket
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px",
                background: "transparent",
                color: "#6b7280",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingTicket;