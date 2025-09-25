import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseCursor, makeCursor } from "@/lib/cursor";
import { reviewCreateSchema } from "@/lib/validation";
import type { ReviewDTO } from "@/types/domain";

const reviewSelect = {
  id: true,
  productId: true,
  authorName: true,
  title: true,
  body: true,
  rating: true,
  createdAt: true
} satisfies Prisma.ReviewSelect;

function toDto(review: Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>): ReviewDTO {
  return {
    id: review.id,
    productId: review.productId,
    authorName: review.authorName,
    title: review.title,
    body: review.body,
    rating: review.rating,
    createdAt: review.createdAt.toISOString()
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const productId = params.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const pageSizeRaw = Number(params.get("pageSize") ?? "10");
  const pageSize = Number.isNaN(pageSizeRaw) ? 10 : Math.min(50, Math.max(1, pageSizeRaw));

  let where: Prisma.ReviewWhereInput = { productId };
  const cursorPayload = parseCursor<string>(params.get("cursor"));
  if (cursorPayload) {
    const createdAt = new Date(cursorPayload.v);
    if (!Number.isNaN(createdAt.getTime())) {
      const comparator = "lt";
      where = {
        AND: [
          where,
          {
            OR: [
              { createdAt: { [comparator]: createdAt } },
              { createdAt: { equals: createdAt }, id: { [comparator]: cursorPayload.id } }
            ]
          }
        ]
      };
    }
  }

  try {
    const reviews = await prisma.review.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: reviewSelect,
      take: pageSize + 1
    });

    const hasNext = reviews.length > pageSize;
    const pageItems = hasNext ? reviews.slice(0, pageSize) : reviews;
    const items = pageItems.map(toDto);

    let nextCursor: string | null = null;
    if (hasNext) {
      const lastReview = pageItems[pageItems.length - 1];
      nextCursor = makeCursor(lastReview.createdAt.toISOString(), lastReview.id);
    }

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("Failed to fetch reviews", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = reviewCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const data = result.data;

  try {
    const review = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
        select: { reviewCount: true, averageRating: true }
      });

      if (!product) {
        throw new Error("Product not found");
      }

      const createdReview = await tx.review.create({
        data: {
          productId: data.productId,
          authorName: data.authorName,
          title: data.title,
          body: data.body,
          rating: data.rating
        },
        select: reviewSelect
      });

      const newReviewCount = product.reviewCount + 1;
      const totalRating = product.averageRating * product.reviewCount + data.rating;
      const newAverage = Number((totalRating / newReviewCount).toFixed(2));

      await tx.product.update({
        where: { id: data.productId },
        data: {
          reviewCount: newReviewCount,
          averageRating: newAverage
        }
      });

      return createdReview;
    });

    return NextResponse.json({ review: toDto(review) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create review", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
