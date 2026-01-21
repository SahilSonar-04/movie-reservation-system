import Booking from "../models/booking.model.js";
import Seat from "../models/seat.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAdminStats = asyncHandler(async (req, res) => {
  // ✅ CONFIRMED revenue
  const revenueAgg = await Booking.aggregate([
    { $match: { status: "CONFIRMED" } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
  ]);

  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

  // ✅ Booking counts
  const totalBookings = await Booking.countDocuments({
    status: "CONFIRMED",
  });

  const cancelledBookings = await Booking.countDocuments({
    status: "CANCELLED",
  });

  const totalBookingsAll = totalBookings + cancelledBookings;

  const cancellationRate =
    totalBookingsAll === 0
      ? 0
      : (cancelledBookings / totalBookingsAll) * 100;

  // ✅ Seat occupancy
  const occupancy = await Seat.aggregate([
    {
      $group: {
        _id: "$show",
        totalSeats: { $sum: 1 },
        bookedSeats: {
          $sum: {
            $cond: [{ $eq: ["$status", "BOOKED"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        showId: "$_id",
        totalSeats: 1,
        bookedSeats: 1,
        occupancyPercent: {
          $multiply: [{ $divide: ["$bookedSeats", "$totalSeats"] }, 100],
        },
      },
    },
    {
      $lookup: {
        from: "shows",
        localField: "showId",
        foreignField: "_id",
        as: "show",
      },
    },
    { $unwind: "$show" },
    {
      $lookup: {
        from: "movies",
        localField: "show.movie",
        foreignField: "_id",
        as: "movie",
      },
    },
    { $unwind: "$movie" },
  ]);

  // ✅ Popular shows
  const popularShows = await Booking.aggregate([
    { $match: { status: "CONFIRMED" } },
    {
      $group: {
        _id: "$show",
        bookingsCount: { $sum: 1 },
      },
    },
    { $sort: { bookingsCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "shows",
        localField: "_id",
        foreignField: "_id",
        as: "show",
      },
    },
    { $unwind: "$show" },
    {
      $lookup: {
        from: "movies",
        localField: "show.movie",
        foreignField: "_id",
        as: "movie",
      },
    },
    { $unwind: "$movie" },
  ]);

  res.json({
    totalRevenue,
    totalBookings,
    cancelledBookings,
    cancellationRate,
    occupancy,
    popularShows,
  });
});
