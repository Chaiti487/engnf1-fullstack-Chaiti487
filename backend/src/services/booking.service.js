const prisma = require("../config/db");
const { getPagination, paginatedResponse } = require("../utils/pagination");

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
      maxWait: 60000,
      timeout: 120000,
    },
  );
}

async function getBookings(filters, userId = null) {
  const { status, resourceId, from, to, page } = filters;

  const limit = 10;
  const where = {};

  if (userId) {
    where.userId = userId;
  }

  if (status) {
    where.status = status;
  }

  if (resourceId) {
    where.resourceId = resourceId;
  }

  if (from) {
    where.endTime = {
      gt: new Date(from),
    };
  }

  if (to) {
    where.startTime = {
      lt: new Date(to),
    };
  }

  const pagination = getPagination(page, limit);

  const [data, total] = await prisma.$transaction(
    [
      prisma.booking.findMany({
        where,
        ...pagination,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      }),

      prisma.booking.count({ where }),
    ],
    {
      isolationLevel: "RepeatableRead",
    },
  );

  return paginatedResponse(data, total, page, limit);
}

async function getBookingById(id) {
  return prisma.booking.findUnique({
    where: { id },
  });
}

async function transitionBooking(id, user, action, note = null) {
  return prisma.$transaction(
    async (tx) => {
      // Prevent concurrent conflicting decisions.

      const rows = await tx.$queryRaw`
        SELECT "id"
        FROM "bookings"
        WHERE "id" = ${id}
        FOR UPDATE
      `;

      if (rows.length === 0) {
        return { error: "BOOKING_NOT_FOUND" };
      }

      const booking = await tx.booking.findUnique({
        where: { id },
      });

      if (action === "CANCEL" && booking.userId !== user.id) {
        return { error: "FORBIDDEN" };
      }

      if (action !== "CANCEL" && user.role !== "ADMIN") {
        return { error: "FORBIDDEN" };
      }

      if (booking.startTime <= new Date()) {
        return { error: "BOOKING_ALREADY_STARTED" };
      }

      let nextStatus;

      switch (action) {
        case "CANCEL":
          if (!["PENDING", "APPROVED"].includes(booking.status)) {
            return { error: "INVALID_TRANSITION" };
          }

          nextStatus = "CANCELLED";
          break;

        case "APPROVE":
          if (booking.status !== "PENDING") {
            return { error: "INVALID_TRANSITION" };
          }

          nextStatus = "APPROVED";
          break;

        case "REJECT":
          if (booking.status !== "PENDING") {
            return { error: "INVALID_TRANSITION" };
          }

          nextStatus = "REJECTED";
          break;

        default:
          return { error: "INVALID_TRANSITION" };
      }

      const updatedBooking = await tx.booking.update({
        where: { id },

        data: {
          status: nextStatus,

          ...(action === "REJECT" ? { decisionNote: note } : {}),
        },
      });

      return {
        booking: updatedBooking,
      };
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
  getBookings,
  getBookingById,
  transitionBooking,
};
