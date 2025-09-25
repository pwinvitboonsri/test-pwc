import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const CATEGORY_PARAM = "category";
const MIN_PRICE_PARAM = "min";
const MAX_PRICE_PARAM = "max";

export function buildProductWhere(params: URLSearchParams): Prisma.ProductWhereInput {
  const filters: Prisma.ProductWhereInput[] = [];
  const categoryRaw = params.get(CATEGORY_PARAM);

  if (categoryRaw) {
    const categories = categoryRaw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    if (categories.length > 0) {
      filters.push({ category: { in: categories } });
    }
  }

  const minRaw = params.get(MIN_PRICE_PARAM);
  if (minRaw) {
    const min = Number(minRaw);
    if (!Number.isNaN(min)) {
      filters.push({ price: { gte: new Decimal(min) } });
    }
  }

  const maxRaw = params.get(MAX_PRICE_PARAM);
  if (maxRaw) {
    const max = Number(maxRaw);
    if (!Number.isNaN(max)) {
      filters.push({ price: { lte: new Decimal(max) } });
    }
  }

  if (filters.length === 0) {
    return {};
  }

  return { AND: filters };
}
