// prisma/seed.js  (pure JS; no ts-node)
const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();
const CATS = [
  "Phones",
  "Books",
  "Laptops",
  "Home",
  "Toys",
  "Sports",
  "Clothing",
];

async function main() {
  const TOTAL = 2000; // small, fast
  const BATCH = 500;
  for (let i = 0; i < TOTAL; i += BATCH) {
    const data = Array.from({ length: Math.min(BATCH, TOTAL - i) }, () => ({
      name: faker.commerce.productName(),
      price: faker.number.int({ min: 1999, max: 299999 }),
      category: faker.helpers.arrayElement(CATS),
      averageRating: faker.number.float({ min: 0, max: 5, fractionDigits: 1 }),
      reviewCount: faker.number.int({ min: 0, max: 500 }),
      description: faker.commerce.productDescription(),
      imageUrl: `https://picsum.photos/seed/${faker.string.uuid()}/600/400`,
    }));
    await prisma.product.createMany({ data });
    console.log(`Inserted ${Math.min(i + BATCH, TOTAL)}/${TOTAL}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(0); // don't crash container if seed fails
  });
