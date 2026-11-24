const bookingService = require("../services/booking.service");

const sendError = require("../utils/apiError");

const { createBookingSchema } = require("../validators/booking.validator");

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

module.exports = {
  createBooking,
};
