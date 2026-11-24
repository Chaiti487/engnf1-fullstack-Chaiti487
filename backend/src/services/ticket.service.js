const prisma = require("../config/db");
const { classifyTicket } = require("./ticketClassifier");

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

module.exports = {
  importTickets,
};
