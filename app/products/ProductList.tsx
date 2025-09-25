"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Price } from "@/components/Price";
import { StarRating } from "@/components/StarRating";
import type { ProductDTO } from "@/types/domain";

interface ProductListProps {
  initialItems: ProductDTO[];
  initialNextCursor?: string | null;
  query: string;
}

interface ProductResponse {
  items: ProductDTO[];
  nextCursor?: string | null;
}

export function ProductList({ initialItems, initialNextCursor, query }: ProductListProps) {
  const [items, setItems] = useState<ProductDTO[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setNextCursor(initialNextCursor ?? null);
  }, [initialItems, initialNextCursor, query]);

  const hasMore = useMemo(() => Boolean(nextCursor), [nextCursor]);

  const fetchMore = async () => {
    if (!nextCursor) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(query);
      params.set("cursor", nextCursor);
      const response = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = (await response.json()) as ProductResponse;
      setItems((previous) => [...previous, ...data.items]);
      setNextCursor(data.nextCursor ?? null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load more products");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return <p className="text-center text-slate-500">No products matched your criteria.</p>;
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <div key={product.id} className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="relative h-48 w-full">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{product.category}</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  <Link href={`/products/${product.id}`}>{product.name}</Link>
                </h3>
              </div>
              <StarRating rating={product.averageRating} reviewCount={product.reviewCount} />
              <p className="text-sm text-slate-600">{product.description}</p>
              <div className="mt-auto flex items-center justify-between">
                <Price value={product.price} />
                <Link href={`/products/${product.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                  View details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={fetchMore}
            disabled={isLoading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
