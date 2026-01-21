import Seat from "../models/seat.model.js";
import Show from "../models/show.model.js";
import generateSeats from "../utils/seatGenerator.js";
import asyncHandler from "../utils/asyncHandler.js";

// ADMIN: Generate seats for a show
export const generateSeatsForShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;

  const show = await Show.findById(showId);
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }

  // Prevent duplicate generation
  const existingSeat = await Seat.findOne({ show: showId });
  if (existingSeat) {
    return res
      .status(400)
      .json({ message: "Seats already generated for this show" });
  }

  const seatNumbers = generateSeats({
    rows: 5,
    seatsPerRow: 10,
  });

  const seatDocs = seatNumbers.map((seat) => ({
    show: showId,
    seatNumber: seat,
  }));

  await Seat.insertMany(seatDocs);

  res.json({
    message: "Seats generated successfully",
    totalSeats: seatDocs.length,
  });
});

// PUBLIC: Get seats for a show
export const getSeatsForShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;
  const now = new Date();

  const seats = await Seat.find({ show: showId }).sort({
    seatNumber: 1,
  });

  res.json(seats);
});
