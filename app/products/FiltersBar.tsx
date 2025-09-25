"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { SortDir, SortKey } from "@/types/domain";

interface FiltersBarProps {
  initialCategory?: string;
  initialMin?: number;
  initialMax?: number;
  initialSort: SortKey;
  initialDir: SortDir;
  initialPageSize: number;
}

export function FiltersBar({
  initialCategory,
  initialMin,
  initialMax,
  initialSort,
  initialDir,
  initialPageSize
}: FiltersBarProps) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory ?? "");
  const [minPrice, setMinPrice] = useState(initialMin?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(initialMax?.toString() ?? "");
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [dir, setDir] = useState<SortDir>(initialDir);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (category.trim().length > 0) {
      params.set("category", category.trim());
    }
    if (minPrice.trim().length > 0) {
      params.set("min", minPrice.trim());
    }
    if (maxPrice.trim().length > 0) {
      params.set("max", maxPrice.trim());
    }
    params.set("sort", sort);
    params.set("dir", dir);
    params.set("pageSize", initialPageSize.toString());

    router.replace(`/products?${params.toString()}`, { scroll: false });
  }, [category, minPrice, maxPrice, sort, dir, router, initialPageSize]);

  const resetFilters = useCallback(() => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort(initialSort);
    setDir(initialDir);
    router.replace("/products", { scroll: false });
  }, [initialDir, initialSort, router]);

  return (
    <form
      className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters();
      }}
    >
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-slate-700" htmlFor="category">
          Categories (comma separated)
        </label>
        <input
          id="category"
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Phones,Books"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-slate-700" htmlFor="min">
          Min price
        </label>
        <input
          id="min"
          name="min"
          type="number"
          min={0}
          step="0.01"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="0"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-slate-700" htmlFor="max">
          Max price
        </label>
        <input
          id="max"
          name="max"
          type="number"
          min={0}
          step="0.01"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="1000"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-slate-700" htmlFor="sort">
          Sort by
        </label>
        <select
          id="sort"
          name="sort"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="price">Price</option>
          <option value="rating">Rating</option>
          <option value="name">Name</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-slate-700" htmlFor="dir">
          Direction
        </label>
        <select
          id="dir"
          name="dir"
          value={dir}
          onChange={(event) => setDir(event.target.value as SortDir)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Clear
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          Apply
        </button>
      </div>
    </form>
  );
}
