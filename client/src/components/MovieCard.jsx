function MovieCard({ movie, onSelect }) {
  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        padding: "16px",
        width: "220px",
        cursor: "pointer",
        borderRadius: "8px",
        transition: "all 0.2s ease",
        background: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
      onClick={() => onSelect(movie)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      }}
    >
      {/* Movie Poster Placeholder */}
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          style={{
            width: "100%",
            height: "280px",
            objectFit: "cover",
            borderRadius: "4px",
            marginBottom: "12px",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "280px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "4px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "48px",
            fontWeight: "bold",
          }}
        >
          🎬
        </div>
      )}

      <h3
        style={{
          margin: "0 0 8px 0",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#333",
        }}
      >
        {movie.title}
      </h3>

      {movie.description && (
        <p
          style={{
            margin: "0 0 8px 0",
            fontSize: "13px",
            color: "#666",
            lineHeight: "1.4",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {movie.description}
        </p>
      )}

      <div style={{ fontSize: "13px", color: "#888" }}>
        {movie.duration && (
          <p style={{ margin: "4px 0" }}>
            <strong>Duration:</strong> {movie.duration} mins
          </p>
        )}

        {movie.language && (
          <p style={{ margin: "4px 0" }}>
            <strong>Language:</strong> {movie.language}
          </p>
        )}

        {movie.genre && movie.genre.length > 0 && (
          <p style={{ margin: "4px 0" }}>
            <strong>Genre:</strong> {movie.genre.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

export default MovieCard;