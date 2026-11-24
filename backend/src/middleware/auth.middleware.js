const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const sendError = require("../utils/apiError");

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(
      res,
      401,
      "UNAUTHENTICATED",
      "Authentication token is required",
    );
  }

  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    return sendError(res, 401, "UNAUTHENTICATED", "Invalid or expired token");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, 401, "UNAUTHENTICATED", "User account not found");
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Authentication failed",
    );
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(
        res,
        401,
        "UNAUTHENTICATED",
        "Authentication is required",
      );
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, "FORBIDDEN", "You do not have permission");
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
