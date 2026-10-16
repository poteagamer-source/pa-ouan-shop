/** รูปที่ generate ตามสไตล์ PDF — อยู่ใน public/images */
export const images = {
  logoMascot: "/images/logo-mascot.webp",
  bgWatermark: "/images/bg-watermark.webp",
  food: {
    bualoy: "/images/food-bualoy.webp",
    chaokuay: "/images/food-chaokuay.webp",
    tubtim: "/images/food-tubtim.webp",
    soymilk: "/images/food-soymilk.webp",
    dessert: "/images/food-dessert.webp",
  },
  topping: {
    redbean: "/images/topping-redbean.webp",
    foithong: "/images/topping-foithong.webp",
    coconut: "/images/topping-coconut.webp",
  },
} as const;

import type { CategoryId } from "../types";

export function foodImageByCategory(category: CategoryId): string {
  return images.food[category];
}
/** registry path รูป static ที่ใช้ซ้ำ; ไฟล์จริงอยู่ใน public/images */
