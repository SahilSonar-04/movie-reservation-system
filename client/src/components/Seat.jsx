// Seat.jsx
import styles from './Seat.module.css';

function Seat({ seat, onClick, isSelected, userId }) {
  const isLockedByMe = seat.lockedBy && seat.lockedBy === userId;

  let stateClass = styles.available;
  let tooltip = "Available — click to select";

  if (seat.status === "BOOKED") {
    stateClass = styles.booked;
    tooltip = "Already booked";
  } else if (isSelected || isLockedByMe) {
    stateClass = styles.selected;
    tooltip = "Selected — click to deselect";
  } else if (seat.status === "LOCKED") {
    stateClass = styles.locked;
    tooltip = "Held by another user";
  }

  const handleClick = () => {
    if (seat.status === "FREE" || isSelected || isLockedByMe) {
      onClick();
    }
  };

  return (
    <div
      className={`${styles.seat} ${stateClass}`}
      onClick={handleClick}
      title={tooltip}
    >
      {seat.seatNumber}
      <div className={`${styles.base} ${isSelected || isLockedByMe ? styles.selectedBase : ""}`} />
    </div>
  );
}

export default Seat;