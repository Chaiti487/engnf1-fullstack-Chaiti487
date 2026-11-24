const prisma = require("../config/db");

async function createBooking(userId, data) {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  return prisma.$transaction(
    async (tx) => {
      // Lock the user to prevent concurrent requests
      // from bypassing the maximum booking limit.

      const users = await tx.$queryRaw`
        SELECT "id"
        FROM "users"
        WHERE "id" = ${userId}
        FOR UPDATE
      `;

      if (users.length === 0) {
        return {
          error: "USER_NOT_FOUND",
        };
      }

      // Lock the resource to serialize reservations
      // for the same resource.

      const resources = await tx.$queryRaw`
        SELECT "id", "isActive"
        FROM "resources"
        WHERE "id" = ${data.resourceId}
        FOR UPDATE
      `;

      if (resources.length === 0) {
        return {
          error: "RESOURCE_NOT_FOUND",
        };
      }

      const resource = resources[0];

      // Validate optional ticket reference.

      if (data.ticketId) {
        const ticket = await tx.ticket.findUnique({
          where: {
            id: data.ticketId,
          },
        });

        if (!ticket) {
          return {
            error: "TICKET_NOT_FOUND",
          };
        }
      }

      if (!resource.isActive) {
        return {
          error: "RESOURCE_INACTIVE",
        };
      }

      // Recheck time after acquiring locks.

      const now = new Date();

      if (startTime <= now) {
        return {
          error: "START_TIME_PASSED",
        };
      }

      // Maximum three future active bookings.

      const activeBookingCount = await tx.booking.count({
        where: {
          userId,

          startTime: {
            gt: now,
          },

          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
      });

      if (activeBookingCount >= 3) {
        return {
          error: "BOOKING_LIMIT_REACHED",
        };
      }

      // Check overlapping bookings.

      const overlappingBooking = await tx.booking.findFirst({
        where: {
          resourceId: data.resourceId,

          status: {
            in: ["PENDING", "APPROVED"],
          },

          startTime: {
            lt: endTime,
          },

          endTime: {
            gt: startTime,
          },
        },

        select: {
          id: true,
        },
      });

      if (overlappingBooking) {
        return {
          error: "SLOT_UNAVAILABLE",
        };
      }

      // Create booking inside the same transaction.

      const booking = await tx.booking.create({
        data: {
          resourceId: data.resourceId,
          userId,
          ticketId: data.ticketId ?? null,
          startTime,
          endTime,
          purpose: data.purpose,
          status: "PENDING",
        },
      });

      return { booking };
    },
    {
      isolationLevel: "ReadCommitted",
      maxWait: 20000,
      timeout: 30000,
    },
  );
}

module.exports = {
  createBooking,
};
