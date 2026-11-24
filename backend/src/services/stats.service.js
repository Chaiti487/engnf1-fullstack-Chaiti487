const prisma = require("../config/db");

function formatCounts(keys, groups, field) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));

  for (const group of groups) {
    counts[group[field]] = group._count._all;
  }

  return counts;
}

async function getTicketStats() {
  const [
    categoryGroups,
    priorityGroups,
    statusGroups,
    reviewedCount,
    agreementCount,
  ] = await prisma.$transaction(
    [
      prisma.ticket.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),

      prisma.ticket.groupBy({
        by: ["priority"],
        _count: { _all: true },
      }),

      prisma.ticket.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),

      prisma.ticket.count({
        where: {
          isReviewed: true,
        },
      }),

      prisma.ticket.count({
        where: {
          isReviewed: true,
          category: {
            equals: prisma.ticket.fields.autoCategory,
          },
        },
      }),
    ],
    {
      isolationLevel: "RepeatableRead",
    },
  );

  const byCategory = formatCounts(
    ["BILLING", "BUG", "FEATURE_REQUEST", "LOGIN", "DELIVERY"],
    categoryGroups,
    "category",
  );

  const byPriority = formatCounts(
    ["LOW", "MEDIUM", "HIGH", "URGENT"],
    priorityGroups,
    "priority",
  );

  const byStatus = formatCounts(
    ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    statusGroups,
    "status",
  );

  const modelAgreementRate =
    reviewedCount === 0
      ? 0
      : Number(((agreementCount / reviewedCount) * 100).toFixed(2));

  return {
    byCategory,
    byPriority,
    byStatus,
    reviewedCount,
    modelAgreementRate,
  };
}

module.exports = {
  getTicketStats,
};
