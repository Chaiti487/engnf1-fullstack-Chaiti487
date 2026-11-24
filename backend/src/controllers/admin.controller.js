const adminService = require("../services/admin.service");

const sendError = require("../utils/apiError");

async function getAdminStats(req, res) {
  try {
    const stats = await adminService.getAdminStats();

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Admin statistics error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch admin statistics",
    );
  }
}

module.exports = {
  getAdminStats,
};
