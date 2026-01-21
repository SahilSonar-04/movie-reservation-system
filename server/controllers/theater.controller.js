import Theater from "../models/theater.model.js";
import Show from "../models/show.model.js";
import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";
import asyncHandler from "../utils/asyncHandler.js";

// ✅ ADMIN: Create theater
export const createTheater = asyncHandler(async (req, res) => {
  const { name, location, address, amenities } = req.body;

  if (!name || !location) {
    return res.status(400).json({ message: "Name and location are required" });
  }

  const theater = await Theater.create({
    name,
    location,
    address,
    amenities: amenities || [],
  });

  res.status(201).json(theater);
});

// ✅ PUBLIC: Get all theaters
export const getTheaters = asyncHandler(async (req, res) => {
  const theaters = await Theater.find().sort({ location: 1, name: 1 });
  res.json(theaters);
});

// ✅ PUBLIC: Get theaters by location/city
export const getTheatersByLocation = asyncHandler(async (req, res) => {
  const { location } = req.params;

  const theaters = await Theater.find({
    location: { $regex: new RegExp(location, "i") },
  }).sort({ name: 1 });

  res.json(theaters);
});

// ✅ PUBLIC: Get unique locations/cities
export const getLocations = asyncHandler(async (req, res) => {
  const locations = await Theater.distinct("location");
  res.json(locations.sort());
});

// ✅ ADMIN: Delete theater
export const deleteTheater = asyncHandler(async (req, res) => {
  const { theaterId } = req.params;

  const theater = await Theater.findById(theaterId);
  if (!theater) {
    return res.status(404).json({ message: "Theater not found" });
  }

  // Check if there are shows for this theater
  const shows = await Show.find({ theater: theaterId });
  const showIds = shows.map((show) => show._id);

  // Check for confirmed bookings
  const confirmedBookings = await Booking.countDocuments({
    show: { $in: showIds },
    status: "CONFIRMED",
  });

  if (confirmedBookings > 0) {
    return res.status(400).json({
      message: `Cannot delete theater. There are ${confirmedBookings} confirmed bookings.`,
    });
  }

  // Delete cascade: seats → cancelled bookings → shows → theater
  await Seat.deleteMany({ show: { $in: showIds } });
  await Booking.deleteMany({
    show: { $in: showIds },
    status: "CANCELLED",
  });
  await Show.deleteMany({ theater: theaterId });
  await Theater.findByIdAndDelete(theaterId);

  res.json({
    message: "Theater and all related data deleted successfully",
    deletedShows: shows.length,
  });
});