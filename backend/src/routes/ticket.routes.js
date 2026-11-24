const express = require("express");

const { authenticate } = require("../middleware/auth.middleware");

const { importTickets } = require("../controllers/ticket.controller");

const router = express.Router();

router.post("/import", authenticate, importTickets);

module.exports = router;
