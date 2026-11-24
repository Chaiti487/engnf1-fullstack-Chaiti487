const resourceService = require("../services/resource.service");

const sendError = require("../utils/apiError");

const {
  createResourceSchema,
  updateResourceSchema,
  resourceQuerySchema,
  availabilityQuerySchema,
} = require("../validators/resource.validator");

function handleResourceError(res, error) {
  if (error.code === "P2002") {
    return sendError(
      res,
      409,
      "CONFLICT",
      "A resource with this name already exists",
    );
  }

  if (error.code === "P2025") {
    return sendError(res, 404, "NOT_FOUND", "Resource not found");
  }

  console.error("Resource error:", error);

  return sendError(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    "Resource operation failed",
  );
}

async function getResources(req, res) {
  const parsed = resourceQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0].message,
    );
  }

  try {
    const resources = await resourceService.getResources(
      parsed.data,
      req.user.role,
    );

    return res.status(200).json(resources);
  } catch (error) {
    return handleResourceError(res, error);
  }
}

async function getResourceById(req, res) {
  try {
    const resource = await resourceService.getResourceById(
      req.params.id,
      req.user.role,
    );

    if (!resource) {
      return sendError(res, 404, "NOT_FOUND", "Resource not found");
    }

    return res.status(200).json(resource);
  } catch (error) {
    return handleResourceError(res, error);
  }
}

async function createResource(req, res) {
  const parsed = createResourceSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0].message,
    );
  }

  try {
    const resource = await resourceService.createResource(parsed.data);

    return res.status(201).json(resource);
  } catch (error) {
    return handleResourceError(res, error);
  }
}

async function updateResource(req, res) {
  try {
    const existing = await resourceService.getResourceById(
      req.params.id,
      req.user.role,
    );

    if (!existing) {
      return sendError(res, 404, "NOT_FOUND", "Resource not found");
    }

    const parsed = updateResourceSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0].message,
      );
    }

    const resource = await resourceService.updateResource(
      req.params.id,
      parsed.data,
    );

    return res.status(200).json(resource);
  } catch (error) {
    return handleResourceError(res, error);
  }
}

async function getResourceAvailability(req, res) {
  try {
    const resource = await resourceService.getResourceById(
      req.params.id,
      req.user.role,
    );

    if (!resource) {
      return sendError(res, 404, "NOT_FOUND", "Resource not found");
    }

    const parsed = availabilityQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0].message,
      );
    }

    const availability = await resourceService.getResourceAvailability(
      resource.id,
      parsed.data.from,
      parsed.data.to,
    );

    return res.status(200).json(availability);
  } catch (error) {
    return handleResourceError(res, error);
  }
}

module.exports = {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  getResourceAvailability,
};
