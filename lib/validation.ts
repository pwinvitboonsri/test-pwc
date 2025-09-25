import { z } from "zod";

export const sortKeySchema = z.enum(["price", "rating", "name"]);
export const sortDirSchema = z.enum(["asc", "desc"]);

export const filtersSchema = z
  .object({
    category: z.string().optional(),
    min: z.coerce.number().nonnegative().optional(),
    max: z.coerce.number().nonnegative().optional(),
    sort: sortKeySchema.default("rating"),
    dir: sortDirSchema.default("desc"),
    pageSize: z.coerce.number().int().min(12).max(96).default(24)
  })
  .refine(
    (value) => {
      if (value.min !== undefined && value.max !== undefined) {
        return value.min <= value.max;
      }
      return true;
    },
    { message: "Minimum price must be less than or equal to maximum price", path: ["max"] }
  );

export const reviewCreateSchema = z.object({
  productId: z.string().cuid(),
  authorName: z.string().min(2).max(80),
  title: z.string().min(2).max(120),
  body: z.string().min(10).max(1000),
  rating: z.coerce.number().int().min(1).max(5)
});
