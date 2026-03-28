import Seat from "./Seat";

function SeatGrid({ seats, selectedSeats, onSeatClick, userId }) {
  const sortedSeats = [...seats].sort((a, b) => {
    const rowA = a.seatNumber.charAt(0);
    const rowB = b.seatNumber.charAt(0);
    if (rowA !== rowB) return rowA.localeCompare(rowB);
    return parseInt(a.seatNumber.slice(1), 10) - parseInt(b.seatNumber.slice(1), 10);
  });

  const seatsByRow = sortedSeats.reduce((acc, seat) => {
    const row = seat.seatNumber.charAt(0);
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  const rows = Object.keys(seatsByRow).sort();

  return (
    <div style={{ display: "inline-block" }}>
      {rows.map((row) => {
        const rowSeats   = seatsByRow[row];
        const half       = Math.floor(rowSeats.length / 2);
        const leftSection  = rowSeats.slice(0, half);
        const rightSection = rowSeats.slice(half);

        return (
          <div
            key={row}
            style={{ display: "flex", alignItems: "center", marginBottom: "10px", gap: "8px" }}
          >
            {/* Row label left */}
            <div style={{
              width: "24px",
              textAlign: "center",
              fontSize: "11px",
              fontWeight: "700",
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.5px",
            }}>
              {row}
            </div>

            {/* Left seats */}
            <div style={{ display: "flex", gap: "8px" }}>
              {leftSection.map((seat) => (
                <Seat
                  key={seat._id}
                  seat={seat}
                  isSelected={selectedSeats.includes(seat._id)}
                  onClick={() => onSeatClick(seat)}
                  userId={userId}
                />
              ))}
            </div>

            {/* Aisle */}
            <div style={{ width: "36px" }} />

            {/* Right seats */}
            <div style={{ display: "flex", gap: "8px" }}>
              {rightSection.map((seat) => (
                <Seat
                  key={seat._id}
                  seat={seat}
                  isSelected={selectedSeats.includes(seat._id)}
                  onClick={() => onSeatClick(seat)}
                  userId={userId}
                />
              ))}
            </div>

            {/* Row label right */}
            <div style={{
              width: "24px",
              textAlign: "center",
              fontSize: "11px",
              fontWeight: "700",
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.5px",
            }}>
              {row}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SeatGrid;