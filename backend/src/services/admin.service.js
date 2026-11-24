const prisma = require("../config/db");

const { getTicketStats } = require("./stats.service");

async function getAdminStats() {
  const [activeResources, bookingGroups, resourceGroups, ticketStats] =
    await Promise.all([
      prisma.resource.count({
        where: {
          isActive: true,
        },
      }),

      prisma.booking.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      prisma.booking.groupBy({
        by: ["resourceId"],

        _count: {
          resourceId: true,
        },

        orderBy: [
          {
            _count: {
              resourceId: "desc",
            },
          },
          {
            resourceId: "asc",
          },
        ],

        take: 3,
      }),

      getTicketStats(),
    ]);

  const bookingsByStatus = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    CANCELLED: 0,
  };

  for (const group of bookingGroups) {
    bookingsByStatus[group.status] = group._count._all;
  }

  const resourceIds = resourceGroups.map((group) => group.resourceId);

  const resources = await prisma.resource.findMany({
    where: {
      id: {
        in: resourceIds,
      },
    },

    select: {
      id: true,
      name: true,
      type: true,
    },
  });

  const resourceMap = new Map(
    resources.map((resource) => [resource.id, resource]),
  );

  const topResources = resourceGroups.map((group) => {
    const resource = resourceMap.get(group.resourceId);

    return {
      resourceId: group.resourceId,
      name: resource?.name ?? "Unknown resource",
      type: resource?.type ?? null,
      bookingCount: group._count.resourceId,
    };
  });

  return {
    activeResources,
    bookingsByStatus,
    topResources,
    ticketStats,
  };
}

module.exports = {
  getAdminStats,
};
