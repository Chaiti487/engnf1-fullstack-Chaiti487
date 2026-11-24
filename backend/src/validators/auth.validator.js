const { z } = require("zod");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .max(254);

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .max(64, "Password cannot exceed 64 characters")
  .regex(/[a-zA-Z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a digit")
  .refine(
    (password) => Buffer.byteLength(password, "utf8") <= 72,
    "Password exceeds bcrypt's byte limit",
  );

const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(64),
});

module.exports = {
  registerSchema,
  loginSchema,
};
