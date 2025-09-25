import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { buildProductWhere } from "@/lib/query";
import { makeCursor, parseCursor } from "@/lib/cursor";
import { filtersSchema } from "@/lib/validation";
import type { ProductDTO, SortDir, SortKey } from "@/types/domain";

const SORT_COLUMN_MAP: Record<SortKey, keyof Prisma.ProductOrderByWithRelationInput> = {
  price: "price",
  rating: "averageRating",
  name: "name"
};

const productSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  price: true,
  imageUrl: true,
  averageRating: true,
  reviewCount: true
} satisfies Prisma.ProductSelect;

function toDto(product: Prisma.ProductGetPayload<{ select: typeof productSelect }>): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: Number(product.price),
    imageUrl: product.imageUrl,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filterResult = filtersSchema.safeParse({
    category: params.get("category") ?? undefined,
    min: params.get("min") ?? undefined,
    max: params.get("max") ?? undefined,
    sort: params.get("sort") ?? undefined,
    dir: params.get("dir") ?? undefined,
    pageSize: params.get("pageSize") ?? undefined
  });

  const filters = filterResult.success ? filterResult.data : filtersSchema.parse({});

  const sortKey: SortKey = filters.sort;
  const sortDir: SortDir = filters.dir;
  const pageSize = filters.pageSize;
  const sortColumn = SORT_COLUMN_MAP[sortKey];

  let where: Prisma.ProductWhereInput = buildProductWhere(params);

  const cursorPayload = parseCursor<string | number>(params.get("cursor"));
  if (cursorPayload) {
    const comparator = sortDir === "asc" ? "gt" : "lt";
    const cursorValue = cursorPayload.v;
    const cursorId = cursorPayload.id;
    const primaryCondition: Prisma.ProductWhereInput =
      sortColumn === "price"
        ? { price: { [comparator]: new Decimal(Number(cursorValue)) } }
        : sortColumn === "averageRating"
          ? { averageRating: { [comparator]: Number(cursorValue) } }
          : { name: { [comparator]: String(cursorValue) } };
    const tieCondition: Prisma.ProductWhereInput =
      sortColumn === "price"
        ? {
            price: { equals: new Decimal(Number(cursorValue)) },
            id: { [comparator]: cursorId }
          }
        : sortColumn === "averageRating"
          ? {
              averageRating: { equals: Number(cursorValue) },
              id: { [comparator]: cursorId }
            }
          : {
              name: { equals: String(cursorValue) },
              id: { [comparator]: cursorId }
            };

    where = {
      AND: [where, { OR: [primaryCondition, tieCondition] }]
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [
    { [sortColumn]: sortDir },
    { id: sortDir }
  ];

  try {
    const products = await prisma.product.findMany({
      where,
      orderBy,
      select: productSelect,
      take: pageSize + 1
    });

    const hasNext = products.length > pageSize;
    const pageItems = hasNext ? products.slice(0, pageSize) : products;
    const items = pageItems.map(toDto);

    let nextCursor: string | null = null;
    if (hasNext) {
      const lastProduct = pageItems[pageItems.length - 1];
      let sortValue: string | number;
      if (sortColumn === "price") {
        sortValue = Number(lastProduct.price);
      } else if (sortColumn === "averageRating") {
        sortValue = lastProduct.averageRating;
      } else {
        sortValue = lastProduct.name;
      }
      nextCursor = makeCursor(sortValue, lastProduct.id);
    }

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("Failed to fetch products", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
