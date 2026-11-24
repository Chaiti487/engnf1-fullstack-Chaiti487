const express = require("express");

const { authenticate } = require("../middleware/auth.middleware");

const {
  importTickets,
  getTickets,
  getTicketById,
  updateTicket,
} = require("../controllers/ticket.controller");

const router = express.Router();

router.post("/import", authenticate, importTickets);

router.get("/", authenticate, getTickets);

router.get("/:id", authenticate, getTicketById);

router.patch("/:id", authenticate, updateTicket);

module.exports = router;
