const prisma = require("../config/db");
const { classifyTicket } = require("./ticketClassifier");
const { getPagination, paginatedResponse } = require("../utils/pagination");

const { escapeSearch } = require("../utils/search");

async function importTickets(tickets) {
  return prisma.$transaction(
    async (tx) => {
      let importedCount = 0;
      let updatedCount = 0;
      let skippedOverrideCount = 0;

      for (const incoming of tickets) {
        const existing = await tx.ticket.findUnique({
          where: {
            externalId: incoming.externalId,
          },
        });

        // Case 1: New ticket
        if (!existing) {
          const prediction = classifyTicket(incoming.subject, incoming.body);

          await tx.ticket.create({
            data: {
              externalId: incoming.externalId,
              subject: incoming.subject,
              body: incoming.body,
              autoCategory: prediction.autoCategory,
              category: prediction.autoCategory,
              priority: prediction.priority,
              status: "OPEN",
              isReviewed: false,
              isHumanOverride: false,
            },
          });

          importedCount++;
          continue;
        }

        // Case 2: Existing ticket
        const changes = {};

        if (existing.subject !== incoming.subject) {
          changes.subject = incoming.subject;
        }

        if (existing.body !== incoming.body) {
          changes.body = incoming.body;
        }

        // Protect human classification
        if (existing.isHumanOverride) {
          skippedOverrideCount++;
        } else {
          const prediction = classifyTicket(incoming.subject, incoming.body);

          if (existing.category !== prediction.autoCategory) {
            changes.category = prediction.autoCategory;
          }

          if (existing.priority !== prediction.priority) {
            changes.priority = prediction.priority;
          }
        }

        // Update only when something has changed
        if (Object.keys(changes).length > 0) {
          await tx.ticket.update({
            where: {
              id: existing.id,
            },
            data: changes,
          });

          updatedCount++;
        }
      }

      const total = await tx.ticket.count();

      return {
        importedCount,
        updatedCount,
        skippedOverrideCount,
        total,
      };
    },
    {
      isolationLevel: "Serializable",
      maxWait: 10000,
      timeout: 60000,
    },
  );
}

async function getTickets(filters) {
  const { status, category, priority, q, page, limit } = filters;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (category) {
    where.category = category;
  }

  if (priority) {
    where.priority = priority;
  }

  if (q) {
    const searchTerm = escapeSearch(q);

    where.OR = [
      {
        subject: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        body: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ];
  }

  const pagination = getPagination(page, limit);

  const [data, total] = await prisma.$transaction(
    [
      prisma.ticket.findMany({
        where,
        ...pagination,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      }),

      prisma.ticket.count({ where }),
    ],
    {
      isolationLevel: "RepeatableRead",
    },
  );

  return paginatedResponse(data, total, page, limit);
}

async function getTicketById(id) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      },
    },
  });

  if (!ticket) {
    return null;
  }

  const { events, ...ticketData } = ticket;

  return {
    ticket: ticketData,
    events,
  };
}


async function updateTicket(id, updates, actor) {
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.ticket.findUnique({
        where: { id },
      });

      if (!existing) {
        return { error: "TICKET_NOT_FOUND" };
      }

      // Validate referenced assignee
      if (updates.assigneeId !== undefined && updates.assigneeId !== null) {
        const assignee = await tx.user.findUnique({
          where: {
            id: updates.assigneeId,
          },
        });

        if (!assignee) {
          return { error: "ASSIGNEE_NOT_FOUND" };
        }
      }

      const trackedFields = ["category", "priority", "status", "assigneeId"];

      const changes = {};
      const events = [];

      for (const field of trackedFields) {
        if (
          updates[field] !== undefined &&
          updates[field] !== existing[field]
        ) {
          changes[field] = updates[field];

          events.push({
            ticketId: id,
            field,
            oldValue: existing[field],
            newValue: updates[field],
            actor,
          });
        }
      }

      // Protect human category decisions
      if (changes.category !== undefined) {
        changes.isHumanOverride = true;
        changes.isReviewed = true;
      }

      // Mark ticket reviewed when leaving OPEN
      if (existing.status === "OPEN" && changes.status !== undefined) {
        changes.isReviewed = true;
      }

      let ticket = existing;

      if (Object.keys(changes).length > 0) {
        ticket = await tx.ticket.update({
          where: { id },
          data: changes,
        });

        await tx.ticketEvent.createMany({
          data: events,
        });
      }

      const history = await tx.ticketEvent.findMany({
        where: {
          ticketId: id,
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      });

      return {
        ticket,
        events: history,
      };
    },
    {
      isolationLevel: "Serializable",
      maxWait: 10000,
      timeout: 30000,
    },
  );
}

module.exports = {
  importTickets,
  getTickets,
  getTicketById,
  updateTicket,
};
