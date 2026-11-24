const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const sendError = require("../utils/apiError");

const { registerSchema, loginSchema } = require("../validators/auth.validator");

const publicUserFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
};

// Register a new standard user
async function register(req, res) {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        result.error.issues[0].message,
      );
    }

    const { name, email, password } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendError(res, 409, "CONFLICT", "Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER",
      },
      select: publicUserFields,
    });

    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(res, 409, "CONFLICT", "Email is already registered");
    }

    console.error("Registration error:", error);

    return sendError(res, 500, "INTERNAL_SERVER_ERROR", "Registration failed");
  }
}

// Authenticate an existing user
async function login(req, res) {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        result.error.issues[0].message,
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return sendError(
        res,
        401,
        "UNAUTHENTICATED",
        "Invalid email or password",
      );
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
        algorithm: "HS256",
      },
    );

    const { passwordHash, ...safeUser } = user;

    return res.status(200).json({
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Login error:", error);

    return sendError(res, 500, "INTERNAL_SERVER_ERROR", "Login failed");
  }
}

// Return the currently authenticated user
async function getMe(req, res) {
  return res.status(200).json({
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  getMe,
};
