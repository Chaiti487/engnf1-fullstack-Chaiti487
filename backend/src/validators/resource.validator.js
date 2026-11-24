const { z } = require("zod");

const resourceTypeSchema = z.enum(["ROOM", "LAB", "EQUIPMENT"]);


const { utcDateTimeSchema, DAY_MS } = require("../utils/dateTime");

const createResourceSchema = z
  .object({
    name: z.string().trim().min(3).max(60),

    type: resourceTypeSchema,

    capacity: z.number().int().min(1).max(500),

    description: z.string().trim().max(300).nullable().optional(),
  })
  .strict();

const updateResourceSchema = createResourceSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const resourceQuerySchema = z.object({
  search: z.string().trim().max(300).optional(),

  type: resourceTypeSchema.optional(),

  minCapacity: z.coerce.number().int().min(1).max(500).optional(),

  page: z.coerce.number().int().min(1).max(1000000).default(1),
});

const availabilityQuerySchema = z
  .object({
    from: utcDateTimeSchema,
    to: utcDateTimeSchema,
  })
  .superRefine((data, ctx) => {
    const from = new Date(data.from);
    const to = new Date(data.to);

    if (to <= from) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "End time must be after start time",
      });

      return;
    }

    if (to.getTime() - from.getTime() > 7 * DAY_MS) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "Availability range cannot exceed 7 days",
      });
    }
  });

module.exports = {
  createResourceSchema,
  updateResourceSchema,
  resourceQuerySchema,
  availabilityQuerySchema,
};
