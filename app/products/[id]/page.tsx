import Image from "next/image";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { StarRating } from "@/components/StarRating";
import { Price } from "@/components/Price";
import type { ReviewDTO } from "@/types/domain";
import { ReviewForm } from "./ReviewForm";

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

const reviewSelect = {
  id: true,
  productId: true,
  authorName: true,
  title: true,
  body: true,
  rating: true,
  createdAt: true
} satisfies Prisma.ReviewSelect;

function mapReview(review: Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>): ReviewDTO {
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

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id }, select: productSelect });
  if (!product) {
    notFound();
  }

  const [latestReviews, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { productId: params.id },
      select: reviewSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10
    }),
    prisma.review.aggregate({ where: { productId: params.id }, _count: { _all: true }, _avg: { rating: true } })
  ]);

  const reviewDtos = latestReviews.map(mapReview);
  const avgRating = Number(aggregate._avg.rating ?? product.averageRating);
  const reviewCount = aggregate._count._all ?? product.reviewCount;

  return (
    <section className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-[2fr,3fr]">
        <div className="relative h-80 w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-slate-500">{product.category}</p>
          <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
          <StarRating rating={avgRating} reviewCount={reviewCount} />
          <Price value={Number(product.price)} />
          <p className="text-base text-slate-600">{product.description}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr,3fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Reviews</h2>
          {reviewDtos.length === 0 ? (
            <p className="text-sm text-slate-500">There are no reviews yet. Be the first to share your experience.</p>
          ) : (
            <ul className="space-y-4">
              {reviewDtos.map((review) => (
                <li key={review.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{review.authorName}</p>
                      <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-slate-900">{review.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{review.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Write a review</h2>
          <p className="mt-2 text-sm text-slate-600">Share your feedback to help other shoppers.</p>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <ReviewForm productId={product.id} />
          </div>
        </div>
      </div>
    </section>
  );
}
