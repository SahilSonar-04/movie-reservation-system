function Seat({ seat, onClick, isSelected, userId }) {
  let bg = "#e0e0e0";
  let cursor = "pointer";
  let tooltip = "Available - Click to select";
  let border = "2px solid #ccc";
  let transform = "scale(1)";
  let boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

  const isLockedByMe = seat.lockedBy && seat.lockedBy === userId;

  if (seat.status === "BOOKED") {
    bg = "#ff4d4f";
    cursor = "not-allowed";
    tooltip = "Already booked";
    border = "2px solid #ff4d4f";
  } else if (isSelected || isLockedByMe) {
    bg = "#1890ff";
    cursor = "pointer";
    tooltip = "Selected by you - Click to deselect";
    border = "2px solid #0050b3";
    transform = "scale(1.05)";
    boxShadow = "0 4px 8px rgba(24, 144, 255, 0.3)";
  } else if (seat.status === "LOCKED") {
    bg = "#faad14";
    cursor = "not-allowed";
    tooltip = "Locked by another user";
    border = "2px solid #faad14";
  }

  const handleClick = () => {
    if (seat.status === "FREE" || isSelected || isLockedByMe) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      title={tooltip}
      style={{
        width: "45px",
        height: "45px",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor,
        color: "#fff",
        fontSize: "11px",
        fontWeight: "bold",
        borderRadius: "6px 6px 2px 2px",
        border,
        transition: "all 0.2s ease",
        userSelect: "none",
        transform,
        boxShadow,
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (seat.status === "FREE" || isSelected || isLockedByMe) {
          e.currentTarget.style.transform = "scale(1.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (isSelected || isLockedByMe) {
          e.currentTarget.style.transform = "scale(1.05)";
        } else {
          e.currentTarget.style.transform = "scale(1)";
        }
      }}
    >
      {seat.seatNumber}
      
      {/* Chair legs effect */}
      <div
        style={{
          position: "absolute",
          bottom: "-2px",
          left: "8px",
          right: "8px",
          height: "2px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "1px",
        }}
      ></div>
    </div>
  );
}

export default Seat;