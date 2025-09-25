import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Product catalogue with reviews and advanced filters"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <a href="/" className="text-xl font-semibold text-slate-900">
              Catalogue
            </a>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <a href="/products" className="hover:text-slate-900">
                Products
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
