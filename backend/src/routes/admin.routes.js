const express = require("express");

const { authenticate, authorize } = require("../middleware/auth.middleware");

const { getAdminStats } = require("../controllers/admin.controller");

const router = express.Router();

router.get("/stats", authenticate, authorize("ADMIN"), getAdminStats);

module.exports = router;
