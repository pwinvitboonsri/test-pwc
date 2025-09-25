import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildProductWhere } from "@/lib/query";
import { makeCursor } from "@/lib/cursor";
import { filtersSchema } from "@/lib/validation";
import { FiltersBar } from "./FiltersBar";
import { ProductList } from "./ProductList";
import type { ProductDTO, SortDir, SortKey } from "@/types/domain";

const SORT_COLUMN_MAP: Record<SortKey, keyof Prisma.ProductOrderByWithRelationInput> = {
  price: "price",
  rating: "averageRating",
  name: "name"
};

function coerceSearchParams(searchParams: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  });
  return params;
}

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

function mapToDto(product: Prisma.ProductGetPayload<{ select: typeof productSelect }>): ProductDTO {
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

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = coerceSearchParams(searchParams);
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

  const where = buildProductWhere(params);

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [
    { [SORT_COLUMN_MAP[sortKey]]: sortDir },
    { id: sortDir }
  ];

  const products = await prisma.product.findMany({
    where,
    orderBy,
    select: productSelect,
    take: pageSize + 1
  });

  const hasNext = products.length > pageSize;
  const pageItems = hasNext ? products.slice(0, pageSize) : products;
  const productDtos = pageItems.map(mapToDto);

  let nextCursor: string | null = null;
  if (hasNext) {
    const lastProduct = pageItems[pageItems.length - 1];
    const sortColumn = SORT_COLUMN_MAP[sortKey];
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

  const listQuery = new URLSearchParams();
  listQuery.set("sort", sortKey);
  listQuery.set("dir", sortDir);
  listQuery.set("pageSize", pageSize.toString());
  if (params.get("category")) {
    listQuery.set("category", params.get("category") as string);
  }
  if (params.get("min")) {
    listQuery.set("min", params.get("min") as string);
  }
  if (params.get("max")) {
    listQuery.set("max", params.get("max") as string);
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Products</h1>
        <p className="text-slate-600">Filter by category and price, sort by rating or price, and load more with infinite scroll.</p>
      </div>
      <FiltersBar
        initialCategory={filters.category}
        initialMin={filters.min}
        initialMax={filters.max}
        initialSort={sortKey}
        initialDir={sortDir}
        initialPageSize={pageSize}
      />
      <ProductList initialItems={productDtos} initialNextCursor={nextCursor} query={listQuery.toString()} />
    </section>
  );
}
