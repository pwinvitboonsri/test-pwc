// app/api/products/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildProductWhere } from "@/lib/query";
import { makeCursor, parseCursor } from "@/lib/cursor";
import { filtersSchema } from "@/lib/validation";
import type { ProductDTO, SortDir, SortKey } from "@/types/domain";

const SORT_COLUMN_MAP: Record<SortKey, keyof Prisma.ProductOrderByWithRelationInput> = {
  price: "price",
  rating: "averageRating",
  name: "name",
};

const productSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  price: true,
  imageUrl: true,
  averageRating: true,
  reviewCount: true,
} satisfies Prisma.ProductSelect;

function toDto(
  product: Prisma.ProductGetPayload<{ select: typeof productSelect }>
): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: Number(product.price),
    imageUrl: product.imageUrl ?? null,
    averageRating: typeof product.averageRating === "number" ? product.averageRating : 0,
    reviewCount: typeof product.reviewCount === "number" ? product.reviewCount : 0,
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
    pageSize: params.get("pageSize") ?? undefined,
  });
  const filters = filterResult.success ? filterResult.data : filtersSchema.parse({});
  const sortKey: SortKey = filters.sort;
  const sortDir: SortDir = filters.dir;
  const sortColumn = SORT_COLUMN_MAP[sortKey];

  const pageSize =
    Math.min(Math.max(Number(filters.pageSize ?? 24) || 24, 12), 96) | 0;

  const whereBase: Prisma.ProductWhereInput = buildProductWhere(params);

  const cursorPayload = parseCursor<string | number>(params.get("cursor") || undefined);

  const primaryCmp: "gt" | "lt" = sortDir === "asc" ? "gt" : "lt";
  const idCmp: "gt" | "lt" = sortDir === "asc" ? "gt" : "lt";

  let cursorFilter: Prisma.ProductWhereInput | undefined;
  if (cursorPayload) {
    const cursorId = String(cursorPayload.id);
    const sortValue: number | string =
      sortColumn === "price" || sortColumn === "averageRating"
        ? Number(cursorPayload.v)
        : String(cursorPayload.v ?? "");

    const primaryCondition = {
      [sortColumn]: { [primaryCmp]: sortValue },
    } as unknown as Prisma.ProductWhereInput;

    const tieCondition = {
      AND: [
        { [sortColumn]: sortValue } as any,
        { id: { [idCmp]: cursorId } },
      ],
    } as Prisma.ProductWhereInput;

    cursorFilter = { OR: [primaryCondition, tieCondition] };
  }

  const whereFinal: Prisma.ProductWhereInput =
    cursorFilter ? { AND: [whereBase, cursorFilter] } : whereBase;

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [
    { [sortColumn]: sortDir } as Prisma.ProductOrderByWithRelationInput,
    { id: sortDir },
  ];

  try {
    const products = await prisma.product.findMany({
      where: whereFinal,
      orderBy,
      select: productSelect,
      take: pageSize + 1,
    });

    const hasNext = products.length > pageSize;
    const pageItems = hasNext ? products.slice(0, pageSize) : products;
    const items = pageItems.map(toDto);

    let nextCursor: string | null = null;
    if (hasNext) {
      const last = pageItems[pageItems.length - 1]!;
      const sortValueForCursor: string | number =
        sortColumn === "price"
          ? Number(last.price)
          : sortColumn === "averageRating"
          ? Number(last.averageRating ?? 0)
          : String(last.name);
      nextCursor = makeCursor(sortValueForCursor, last.id);
    }

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("Failed to fetch products", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
