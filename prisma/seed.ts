import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CategoryConfig {
  name: string;
  minPrice: number;
  maxPrice: number;
  description: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  { name: "Phones", minPrice: 299, maxPrice: 1499, description: "Stay connected with cutting-edge smartphones." },
  { name: "Books", minPrice: 9, maxPrice: 45, description: "Page-turning titles across genres for every reader." },
  { name: "Laptops", minPrice: 499, maxPrice: 2999, description: "Portable powerhouses for work and play." },
  { name: "Home", minPrice: 15, maxPrice: 350, description: "Upgrade every room with smart and stylish essentials." },
  { name: "Toys", minPrice: 5, maxPrice: 180, description: "Fun and learning for children of all ages." },
  { name: "Sports", minPrice: 25, maxPrice: 650, description: "Gear up for peak performance in every sport." },
  { name: "Clothing", minPrice: 12, maxPrice: 420, description: "Timeless fashion and everyday comfort." }
];

const PRODUCTS_PER_CATEGORY = 3600;
const REVIEW_MAX_PER_PRODUCT = 5;
const PRODUCT_BATCH_SIZE = 1000;
const REVIEW_BATCH_SIZE = 5000;
const UPDATE_BATCH_SIZE = 500;

function randomPrice(min: number, max: number): number {
  const value = min + Math.random() * (max - min);
  return Number(value.toFixed(2));
}

function makeProductName(category: string, index: number): string {
  const baseNumber = index + 1;
  return `${category} Item ${baseNumber.toString().padStart(4, "0")}`;
}

function makeImageUrl(category: string, index: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(category)}-${index}/640/480`;
}

function randomPastDate(): Date {
  const now = Date.now();
  const days = Math.floor(Math.random() * 365);
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

async function insertProducts(): Promise<void> {
  const productData: Prisma.ProductCreateManyInput[] = [];

  CATEGORY_CONFIGS.forEach((config) => {
    for (let index = 0; index < PRODUCTS_PER_CATEGORY; index += 1) {
      productData.push({
        name: makeProductName(config.name, index),
        description: `${config.description} Model ${index + 1} features premium materials and reliable performance for daily use.`,
        category: config.name,
        price: randomPrice(config.minPrice, config.maxPrice),
        imageUrl: makeImageUrl(config.name, index)
      });
    }
  });

  for (let offset = 0; offset < productData.length; offset += PRODUCT_BATCH_SIZE) {
    const batch = productData.slice(offset, offset + PRODUCT_BATCH_SIZE);
    await prisma.product.createMany({ data: batch });
    console.log(`Inserted products ${offset + 1} - ${Math.min(offset + batch.length, productData.length)}`);
  }
}

async function insertReviews(): Promise<void> {
  const products = await prisma.product.findMany({ select: { id: true } });
  const updates: Array<{ id: string; reviewCount: number; averageRating: number }> = [];
  const reviewData: Prisma.ReviewCreateManyInput[] = [];

  products.forEach((product) => {
    const reviewTotal = Math.floor(Math.random() * (REVIEW_MAX_PER_PRODUCT + 1));
    if (reviewTotal === 0) {
      return;
    }
    let ratingSum = 0;
    for (let index = 0; index < reviewTotal; index += 1) {
      const rating = Math.floor(Math.random() * 5) + 1;
      ratingSum += rating;
      reviewData.push({
        productId: product.id,
        authorName: `Customer ${index + 1}`,
        title: `Thoughts on product ${index + 1}`,
        body: "This product exceeded expectations with its build quality and performance.",
        rating,
        createdAt: randomPastDate()
      });
    }
    updates.push({ id: product.id, reviewCount: reviewTotal, averageRating: Number((ratingSum / reviewTotal).toFixed(2)) });
  });

  for (let offset = 0; offset < reviewData.length; offset += REVIEW_BATCH_SIZE) {
    const batch = reviewData.slice(offset, offset + REVIEW_BATCH_SIZE);
    await prisma.review.createMany({ data: batch });
    console.log(`Inserted reviews ${offset + 1} - ${Math.min(offset + batch.length, reviewData.length)}`);
  }

  for (let offset = 0; offset < updates.length; offset += UPDATE_BATCH_SIZE) {
    const batch = updates.slice(offset, offset + UPDATE_BATCH_SIZE);
    await prisma.$transaction(
      batch.map((update) =>
        prisma.product.update({
          where: { id: update.id },
          data: { reviewCount: update.reviewCount, averageRating: update.averageRating }
        })
      )
    );
  }
}

async function main(): Promise<void> {
  console.log("Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();

  console.log("Seeding products...");
  await insertProducts();

  console.log("Seeding reviews...");
  await insertReviews();

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
