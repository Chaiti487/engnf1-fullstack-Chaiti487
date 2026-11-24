const statsService = require("../services/stats.service");
const sendError = require("../utils/apiError");

async function getStats(req, res) {
  try {
    const stats = await statsService.getTicketStats();

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Ticket statistics error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch ticket statistics",
    );
  }
}

module.exports = {
  getStats,
};
