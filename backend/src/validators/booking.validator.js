const { z } = require("zod");

const {
  utcDateTimeSchema,
  MINUTE_MS,
  DAY_MS,
  isHalfHourBoundary,
} = require("../utils/dateTime");

const createBookingSchema = z
  .object({
    resourceId: z.string().trim().min(1),

    startTime: utcDateTimeSchema,

    endTime: utcDateTimeSchema,

    purpose: z.string().trim().min(5).max(200),

    ticketId: z.string().trim().min(1).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    const now = Date.now();

    if (!isHalfHourBoundary(start) || !isHalfHourBoundary(end)) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Booking times must be on UTC half-hour boundaries",
      });
    }

    const duration = (end.getTime() - start.getTime()) / MINUTE_MS;

    if (duration < 30 || duration > 240) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Booking duration must be between 30 and 240 minutes",
      });
    }

    if (start.getTime() <= now) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Booking must start in the future",
      });
    }

    if (start.getTime() > now + 30 * DAY_MS) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Bookings cannot be made more than 30 days ahead",
      });
    }
  });

const bookingStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

const myBookingsQuerySchema = z.object({
  status: bookingStatusSchema.optional(),

  page: z.coerce.number().int().min(1).max(1000000).default(1),
});

const adminBookingsQuerySchema = myBookingsQuerySchema
  .extend({
    resourceId: z.string().trim().min(1).optional(),
    from: utcDateTimeSchema.optional(),
    to: utcDateTimeSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && new Date(data.from) >= new Date(data.to)) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "End time must be after start time",
      });
    }
  });

const rejectBookingSchema = z
  .object({
    note: z.string().trim().min(5).max(200),
  })
  .strict();

module.exports = {
  createBookingSchema,
  myBookingsQuerySchema,
  adminBookingsQuerySchema,
  rejectBookingSchema,
};
