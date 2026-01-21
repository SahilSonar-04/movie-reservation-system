import Seat from "./Seat";

function SeatGrid({ seats, selectedSeats, onSeatClick, userId }) {
  // Sort seats by row and number
  const sortedSeats = [...seats].sort((a, b) => {
    const rowA = a.seatNumber.charAt(0);
    const rowB = b.seatNumber.charAt(0);

    if (rowA !== rowB) {
      return rowA.localeCompare(rowB);
    }

    const numA = parseInt(a.seatNumber.slice(1), 10);
    const numB = parseInt(b.seatNumber.slice(1), 10);

    return numA - numB;
  });

  // Group seats by row
  const seatsByRow = sortedSeats.reduce((acc, seat) => {
    const row = seat.seatNumber.charAt(0);
    if (!acc[row]) {
      acc[row] = [];
    }
    acc[row].push(seat);
    return acc;
  }, {});

  const rows = Object.keys(seatsByRow).sort();

  return (
    <div style={{ display: "inline-block" }}>
      {rows.map((row, rowIndex) => {
        const rowSeats = seatsByRow[row];
        const seatsPerRow = rowSeats.length;
        
        // Create left and right sections with aisle in middle
        const leftSection = rowSeats.slice(0, Math.floor(seatsPerRow / 2));
        const rightSection = rowSeats.slice(Math.floor(seatsPerRow / 2));

        return (
          <div
            key={row}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
              gap: "8px",
            }}
          >
            {/* Row Label */}
            <div
              style={{
                width: "30px",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "14px",
                color: "#666",
              }}
            >
              {row}
            </div>

            {/* Left Section */}
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
            <div style={{ width: "40px" }}></div>

            {/* Right Section */}
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

            {/* Row Label (Right) */}
            <div
              style={{
                width: "30px",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "14px",
                color: "#666",
              }}
            >
              {row}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SeatGrid;