const express = require("express");

const { authenticate } = require("../middleware/auth.middleware");

const { getStats } = require("../controllers/stats.controller");

const router = express.Router();

router.get("/", authenticate, getStats);

module.exports = router;
