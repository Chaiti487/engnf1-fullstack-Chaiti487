const sendError = require("../utils/apiError");

const {
  importTicketsSchema,
  ticketQuerySchema,
  updateTicketSchema,
} = require("../validators/ticket.validator");

const ticketService = require("../services/ticket.service");

async function importTickets(req, res) {
  const result = importTicketsSchema.safeParse(req.body);

  if (!result.success) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      result.error.issues[0].message,
    );
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const summary = await ticketService.importTickets(result.data.tickets);

      return res.status(200).json(summary);
    } catch (error) {
      const retryable = error.code === "P2034" || error.code === "P2002";

      if (retryable && attempt < 2) {
        continue;
      }

      if (retryable) {
        return sendError(
          res,
          409,
          "CONFLICT",
          "Concurrent import conflict. Please retry.",
        );
      }

      console.error("Ticket import error:", error);

      return sendError(
        res,
        500,
        "INTERNAL_SERVER_ERROR",
        "Ticket import failed",
      );
    }
  }
}


async function getTickets(req, res) {
  const result = ticketQuerySchema.safeParse(req.query);

  if (!result.success) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      result.error.issues[0].message,
    );
  }

  try {
    const tickets = await ticketService.getTickets(result.data);

    return res.status(200).json(tickets);
  } catch (error) {
    console.error("Get tickets error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch tickets",
    );
  }
}


async function getTicketById(req, res) {
  try {
    const result = await ticketService.getTicketById(req.params.id);

    if (!result) {
      return sendError(res, 404, "NOT_FOUND", "Ticket not found");
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Ticket details error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch ticket details",
    );
  }
}


async function updateTicket(req, res) {
  try {
    const existing = await ticketService.getTicketById(req.params.id);

    if (!existing) {
      return sendError(res, 404, "NOT_FOUND", "Ticket not found");
    }

    const parsed = updateTicketSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0].message,
      );
    }

    const actor = req.get("X-Agent")?.trim() || req.user.email;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await ticketService.updateTicket(
          req.params.id,
          parsed.data,
          actor,
        );

        if (result.error === "TICKET_NOT_FOUND") {
          return sendError(res, 404, "NOT_FOUND", "Ticket not found");
        }

        if (result.error === "ASSIGNEE_NOT_FOUND") {
          return sendError(res, 404, "NOT_FOUND", "Assignee not found");
        }

        return res.status(200).json(result);
      } catch (error) {
        if (error.code === "P2034" && attempt < 2) {
          continue;
        }

        throw error;
      }
    }
  } catch (error) {
    console.error("Update ticket error:", error);

    if (error.code === "P2034") {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Concurrent update conflict. Please retry.",
      );
    }

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to update ticket",
    );
  }
}

module.exports = {
  importTickets,
  getTickets,
  getTicketById,
  updateTicket,
};
