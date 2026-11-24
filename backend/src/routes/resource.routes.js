const express = require("express");

const { authenticate, authorize } = require("../middleware/auth.middleware");

const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
} = require("../controllers/resource.controller");

const router = express.Router();

router.get("/", authenticate, getResources);

router.get("/:id", authenticate, getResourceById);

router.post("/", authenticate, authorize("ADMIN"), createResource);

router.patch("/:id", authenticate, authorize("ADMIN"), updateResource);

module.exports = router;
