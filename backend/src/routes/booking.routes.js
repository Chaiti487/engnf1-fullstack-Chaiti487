const express = require("express");

const { authenticate, authorize } = require("../middleware/auth.middleware");

const {
  createBooking,
  getMyBookings,
  getBookingById,
  getAllBookings,
  cancelBooking,
  approveBooking,
  rejectBooking,
} = require("../controllers/booking.controller");

const router = express.Router();

router.post("/", authenticate, createBooking);

router.get("/mine", authenticate, getMyBookings);

router.get("/", authenticate, authorize("ADMIN"), getAllBookings);

router.get("/:id", authenticate, getBookingById);

router.patch("/:id/cancel", authenticate, cancelBooking);

router.patch("/:id/approve", authenticate, authorize("ADMIN"), approveBooking);

router.patch("/:id/reject", authenticate, authorize("ADMIN"), rejectBooking);

module.exports = router;
