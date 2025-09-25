import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold text-slate-900">Discover our catalogue</h1>
      <p className="max-w-2xl text-lg text-slate-600">
        Browse tens of thousands of products, drill into the details, compare pricing, and read authentic reviews. Use the
        powerful filtering and sorting tools to find the exact item you need.
      </p>
      <Link
        href="/products"
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
      >
        View products
      </Link>
    </section>
  );
}
