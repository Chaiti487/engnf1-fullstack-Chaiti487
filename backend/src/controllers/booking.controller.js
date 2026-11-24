const bookingService = require("../services/booking.service");

const sendError = require("../utils/apiError");

const {
  createBookingSchema,
  myBookingsQuerySchema,
  adminBookingsQuerySchema,
  rejectBookingSchema,
} = require("../validators/booking.validator");

async function createBooking(req, res) {
  const parsed = createBookingSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0].message,
    );
  }

  try {
    const result = await bookingService.createBooking(req.user.id, parsed.data);

    switch (result.error) {
      case "USER_NOT_FOUND":
        return sendError(res, 401, "UNAUTHENTICATED", "User not found");

      case "RESOURCE_NOT_FOUND":
        return sendError(res, 404, "NOT_FOUND", "Resource not found");

      case "TICKET_NOT_FOUND":
        return sendError(res, 404, "NOT_FOUND", "Ticket not found");

      case "RESOURCE_INACTIVE":
        return sendError(res, 409, "CONFLICT", "Resource is inactive");

      case "START_TIME_PASSED":
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "Booking must start in the future",
        );

      case "BOOKING_LIMIT_REACHED":
        return sendError(
          res,
          409,
          "CONFLICT",
          "Maximum three future active bookings allowed",
        );

      case "SLOT_UNAVAILABLE":
        return sendError(
          res,
          409,
          "CONFLICT",
          "The requested slot is unavailable",
        );
    }

    return res.status(201).json(result.booking);
  } catch (error) {
    const details = [error.message, JSON.stringify(error.meta ?? {})].join(" ");

    if (
      error.code === "P2034" ||
      details.includes("23P01") ||
      details.includes("prevent_overlapping_bookings")
    ) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "The requested slot is unavailable",
      );
    }

    console.error("Create booking error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to create booking",
    );
  }
}

async function getMyBookings(req, res) {
  const parsed = myBookingsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0].message,
    );
  }

  try {
    const bookings = await bookingService.getBookings(parsed.data, req.user.id);

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("My bookings error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch bookings",
    );
  }
}


async function getBookingById(req, res) {
  try {
    const booking = await bookingService.getBookingById(req.params.id);

    if (!booking) {
      return sendError(res, 404, "NOT_FOUND", "Booking not found");
    }

    if (req.user.role !== "ADMIN" && booking.userId !== req.user.id) {
      return sendError(res, 403, "FORBIDDEN", "You cannot access this booking");
    }

    return res.status(200).json(booking);
  } catch (error) {
    console.error("Booking details error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch booking details",
    );
  }
}


async function getAllBookings(req, res) {
  const parsed = adminBookingsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0].message,
    );
  }

  try {
    const bookings = await bookingService.getBookings(parsed.data);

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Admin bookings error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch bookings",
    );
  }
}


async function handleTransition(req, res, action) {
  try {
    const existing = await bookingService.getBookingById(req.params.id);

    if (!existing) {
      return sendError(res, 404, "NOT_FOUND", "Booking not found");
    }

    if (action === "CANCEL" && existing.userId !== req.user.id) {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Only the booking owner can cancel",
      );
    }

    let note = null;

    if (action === "REJECT") {
      const parsed = rejectBookingSchema.safeParse(req.body);

      if (!parsed.success) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          parsed.error.issues[0].message,
        );
      }

      note = parsed.data.note;
    }

    const result = await bookingService.transitionBooking(
      req.params.id,
      req.user,
      action,
      note,
    );

    switch (result.error) {
      case "BOOKING_NOT_FOUND":
        return sendError(res, 404, "NOT_FOUND", "Booking not found");

      case "FORBIDDEN":
        return sendError(res, 403, "FORBIDDEN", "You do not have permission");

      case "BOOKING_ALREADY_STARTED":
        return sendError(res, 409, "CONFLICT", "Booking has already started");

      case "INVALID_TRANSITION":
        return sendError(
          res,
          409,
          "CONFLICT",
          "Invalid booking status transition",
        );
    }

    return res.status(200).json(result.booking);
  } catch (error) {
    console.error("Booking transition error:", error);

    if (error.code === "P2034") {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Concurrent booking update conflict",
      );
    }

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to update booking",
    );
  }
}

async function cancelBooking(req, res) {
  return handleTransition(req, res, "CANCEL");
}

async function approveBooking(req, res) {
  return handleTransition(req, res, "APPROVE");
}

async function rejectBooking(req, res) {
  return handleTransition(req, res, "REJECT");
}


module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  getAllBookings,
  cancelBooking,
  approveBooking,
  rejectBooking,
};
