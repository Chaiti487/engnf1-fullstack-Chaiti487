const express = require("express");

const { authenticate } = require("../middleware/auth.middleware");

const { createBooking } = require("../controllers/booking.controller");

const router = express.Router();

router.post("/", authenticate, createBooking);

module.exports = router;
