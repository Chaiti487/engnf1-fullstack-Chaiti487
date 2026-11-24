const { z } = require("zod");

const importTicketSchema = z.object({
  externalId: z.string().trim().min(1),

  subject: z.string().trim().min(3).max(150),

  body: z.string().trim().min(5).max(2000),
});

const importTicketsSchema = z.object({
  tickets: z.array(importTicketSchema),
});

module.exports = {
  importTicketsSchema,
};
