const sendError = require("../utils/apiError");

const { importTicketsSchema } = require("../validators/ticket.validator");

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

module.exports = {
  importTickets,
};
