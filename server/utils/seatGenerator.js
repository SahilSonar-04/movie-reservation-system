const generateSeats = ({ rows = 5, seatsPerRow = 10 }) => {
  const seats = [];

  for (let i = 0; i < rows; i++) {
    const rowChar = String.fromCharCode(65 + i); // A, B, C...

    for (let j = 1; j <= seatsPerRow; j++) {
      seats.push(`${rowChar}${j}`);
    }
  }

  return seats;
};

export default generateSeats;
