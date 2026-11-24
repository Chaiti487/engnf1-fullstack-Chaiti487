const express = require("express");

const { authenticate } = require("../middleware/auth.middleware");

const {
  importTickets,
  getTickets,
} = require("../controllers/ticket.controller");

const router = express.Router();

router.post("/import", authenticate, importTickets);

router.get("/", authenticate, getTickets);

module.exports = router;
