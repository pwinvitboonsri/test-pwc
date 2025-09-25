// lib/query.ts
import type { Prisma } from "@prisma/client";

const CATEGORY_PARAM = "category";
const MIN_PRICE_PARAM = "min";
const MAX_PRICE_PARAM = "max";

function toIntOrUndef(v: string | null): number | undefined {
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

export function buildProductWhere(params: URLSearchParams): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];

  const categoryRaw = params.get(CATEGORY_PARAM);
  if (categoryRaw) {
    const categories = categoryRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (categories.length) {
      and.push({ category: { in: categories } });
    }
  }

  let min = toIntOrUndef(params.get(MIN_PRICE_PARAM));
  let max = toIntOrUndef(params.get(MAX_PRICE_PARAM));

  if (min !== undefined && max !== undefined && min > max) {
    [min, max] = [max, min];
  }

  if (min !== undefined || max !== undefined) {
    and.push({
      price: {
        ...(min !== undefined ? { gte: min } : null),
        ...(max !== undefined ? { lte: max } : null),
      },
    });
  }

  return and.length ? { AND: and } : {};
}
