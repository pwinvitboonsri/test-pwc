import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ProductDTO } from "@/types/domain";

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

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id }, select: productSelect });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const stats = await prisma.review.aggregate({
    where: { productId: params.id },
    _count: { _all: true },
    _avg: { rating: true }
  });

  return NextResponse.json({
    product: toDto(product),
    stats: {
      reviewCount: stats._count._all,
      avgRating: Number(stats._avg.rating ?? 0)
    }
  });
}
