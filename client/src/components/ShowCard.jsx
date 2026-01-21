function ShowCard({ show, onSelect }) {
  const showDate = new Date(show.startTime);
  const formattedDate = showDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = showDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        padding: "16px",
        marginBottom: "12px",
        cursor: "pointer",
        borderRadius: "8px",
        transition: "all 0.2s ease",
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      onClick={() => onSelect(show)}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f5f5f5";
        e.currentTarget.style.borderColor = "#1890ff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.borderColor = "#e0e0e0";
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold" }}>
          {show.screen}
        </p>

        <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
          📅 {formattedDate}
        </p>

        <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
          🕐 {formattedTime}
        </p>
      </div>

      <div
        style={{
          padding: "8px 16px",
          background: "#1890ff",
          color: "white",
          borderRadius: "4px",
          fontWeight: "bold",
          fontSize: "16px",
        }}
      >
        ₹{show.price}
      </div>
    </div>
  );
}

export default ShowCard;