const { z } = require("zod");

const importTicketSchema = z.object({
  externalId: z.string().trim().min(1),

  subject: z.string().trim().min(3).max(150),

  body: z.string().trim().min(5).max(2000),
});

const importTicketsSchema = z.object({
  tickets: z.array(importTicketSchema),
});

const ticketQuerySchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),

  category: z
    .enum(["BILLING", "BUG", "FEATURE_REQUEST", "LOGIN", "DELIVERY"])
    .optional(),

  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),

  q: z.string().trim().max(2000).optional(),

  page: z.coerce.number().int().min(1).max(1000000).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});


const updateTicketSchema = z
  .object({
    category: z
      .enum(["BILLING", "BUG", "FEATURE_REQUEST", "LOGIN", "DELIVERY"])
      .optional(),

    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),

    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),

    assigneeId: z.string().trim().min(1).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

module.exports = {
  importTicketsSchema,
  ticketQuerySchema,
  updateTicketSchema,
};
