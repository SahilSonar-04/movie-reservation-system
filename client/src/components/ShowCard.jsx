function ShowCard({ show, onSelect }) {
  const showDate = new Date(show.startTime);
  const isPast = showDate < new Date();

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
      onClick={() => !isPast && onSelect && onSelect(show)}
      style={{
        border: isPast ? "1px solid #f3f4f6" : "1px solid #e5e7eb",
        padding: "16px",
        cursor: isPast ? "not-allowed" : "pointer",
        borderRadius: "8px",
        transition: "all 0.2s",
        background: isPast ? "#fafafa" : "#fff",
        opacity: isPast ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isPast) {
          e.currentTarget.style.borderColor = "#dc2626";
          e.currentTarget.style.background = "#fef2f2";
        }
      }}
      onMouseLeave={(e) => {
        if (!isPast) {
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.background = "#fff";
        }
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#111827" }}>
          {show.screen}
        </p>
        <div
          style={{
            padding: "4px 10px",
            background: isPast ? "#f3f4f6" : "#fef2f2",
            color: isPast ? "#9ca3af" : "#dc2626",
            borderRadius: "6px",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          ₹{show.price}
        </div>
      </div>

      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
        {formattedDate}
      </div>

      <div
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: isPast ? "#9ca3af" : "#dc2626",
        }}
      >
        {formattedTime}
      </div>

      {isPast && (
        <span
          style={{
            display: "inline-block",
            marginTop: "8px",
            fontSize: "11px",
            padding: "4px 8px",
            background: "#f3f4f6",
            color: "#6b7280",
            borderRadius: "4px",
            fontWeight: "500",
            textTransform: "uppercase",
          }}
        >
          Show Ended
        </span>
      )}
    </div>
  );
}

export default ShowCard;