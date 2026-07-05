import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoriesSeed = [
  { key: "bualoy", label: "บัวลอย", colorText: "text-brand", colorBg: "bg-brand-light", colorBorder: "border-brand", sortOrder: 1 },
  { key: "chaokuay", label: "เฉาก๊วย", colorText: "text-green-600", colorBg: "bg-green-50", colorBorder: "border-green-500", sortOrder: 2 },
  { key: "tubtim", label: "ทับทิมกรอบ", colorText: "text-red-500", colorBg: "bg-red-50", colorBorder: "border-red-400", sortOrder: 3 },
  { key: "soymilk", label: "น้ำแป๊ะอ้วน", colorText: "text-blue-500", colorBg: "bg-blue-50", colorBorder: "border-blue-400", sortOrder: 4 },
  { key: "dessert", label: "ขนมหวาน", colorText: "text-purple-500", colorBg: "bg-purple-50", colorBorder: "border-purple-400", sortOrder: 5 },
];

const IMG = "/images/food-bualoy.png";

const productsSeed: {
  name: string;
  price: number;
  categoryKey: string;
  bestseller?: boolean;
  recommended?: boolean;
  stockQty?: number;
}[] = [
  { name: "บัวลอยไข่หวาน", price: 35, categoryKey: "bualoy", bestseller: true, recommended: true, stockQty: 30 },
  { name: "บัวลอยภูเขาไฟ", price: 35, categoryKey: "bualoy", bestseller: true, recommended: true, stockQty: 3 },
  { name: "บัวลอยนมสด", price: 30, categoryKey: "bualoy", bestseller: true, recommended: true, stockQty: 30 },
  { name: "บัวลอยชาไทย", price: 35, categoryKey: "bualoy", recommended: true, stockQty: 10 },
  { name: "บัวลอยมะพร้าวอ่อน", price: 30, categoryKey: "bualoy", stockQty: 12 },
  { name: "บัวลอยไข่เค็มหวาน", price: 35, categoryKey: "bualoy", stockQty: 8 },
  { name: "บัวลอยไข่เป็ดหวาน", price: 40, categoryKey: "bualoy", recommended: true, stockQty: 20 },
  { name: "บัวลอยงาดำ", price: 40, categoryKey: "bualoy", stockQty: 5 },
  { name: "บัวลอยกะทิ", price: 25, categoryKey: "bualoy", stockQty: 15 },
  { name: "เฉาก๊วยน้ำเชื่อม", price: 25, categoryKey: "chaokuay", stockQty: 25 },
  { name: "เฉาก๊วยน้ำลำไย", price: 35, categoryKey: "chaokuay", recommended: true, bestseller: true, stockQty: 18 },
  { name: "เฉาก๊วยนมสด", price: 30, categoryKey: "chaokuay", recommended: true, stockQty: 9 },
  { name: "เฉาก๊วยชาไทย", price: 35, categoryKey: "chaokuay", stockQty: 6 },
  { name: "เฉาก๊วยลำไย", price: 30, categoryKey: "chaokuay", stockQty: 4 },
  { name: "เฉาก๊วยภูเขาไฟ", price: 40, categoryKey: "chaokuay", bestseller: true, stockQty: 22 },
  { name: "ทับทิมกรอบลำไย", price: 35, categoryKey: "tubtim", recommended: true, stockQty: 14 },
  { name: "ทับทิมกรอบแป๊ะอ้วน", price: 40, categoryKey: "tubtim", bestseller: true, stockQty: 7 },
  { name: "ทับทิมกรอบบัวลอย", price: 55, categoryKey: "tubtim", stockQty: 11 },
  { name: "น้ำเต้าหู้ร้อน", price: 35, categoryKey: "soymilk", stockQty: 20 },
  { name: "น้ำเต้าหู้เย็น", price: 35, categoryKey: "soymilk", recommended: true, stockQty: 16 },
  { name: "น้ำแป๊ะอ้วน 4 อย่าง", price: 35, categoryKey: "dessert", bestseller: true, recommended: true, stockQty: 13 },
  { name: "ลอดช่องกะทิ", price: 25, categoryKey: "dessert", recommended: true, stockQty: 9 },
  { name: "ข้าวเหนียวมะม่วง", price: 40, categoryKey: "dessert", stockQty: 5 },
  { name: "บัวลอยแป๊ะอ้วน", price: 35, categoryKey: "dessert", bestseller: true, stockQty: 21 },
];

const toppingsSeed = [
  { name: "ถั่วแดง", price: 5 },
  { name: "ลูกเดือย", price: 5 },
  { name: "ข้าวโพด", price: 5 },
  { name: "เฉาก๊วย", price: 5 },
  { name: "ฝอยทอง", price: 10 },
  { name: "มะพร้าว", price: 10 },
  { name: "ขนุน", price: 10 },
];

async function main() {
  console.log("Seeding categories...");
  const categoryByKey: Record<string, string> = {};
  for (const c of categoriesSeed) {
    const created = await prisma.category.upsert({
      where: { key: c.key },
      update: c,
      create: c,
    });
    categoryByKey[c.key] = created.id;
  }

  console.log("Seeding products...");
  for (const p of productsSeed) {
    await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        image: IMG,
        bestseller: p.bestseller ?? false,
        recommended: p.recommended ?? false,
        stockQty: p.stockQty ?? 10,
        stockUnit: "ก้อน",
        categoryId: categoryByKey[p.categoryKey],
      },
    });
  }

  console.log("Seeding toppings (as isTopping products, no category needed)...");
  // ท็อปปิ้งผูกกับหมวดขนมหวานไว้ชั่วคราว เพื่อให้มี categoryId ตาม schema
  const fallbackCategoryId = categoryByKey["dessert"];
  for (const t of toppingsSeed) {
    await prisma.product.create({
      data: {
        name: t.name,
        price: t.price,
        image: IMG,
        isTopping: true,
        categoryId: fallbackCategoryId,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
