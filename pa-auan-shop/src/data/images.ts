/** รูปที่ generate ตามสไตล์ PDF — อยู่ใน public/images */
export const images = {
  logoMascot: "/images/logo-mascot.png",
  bgWatermark: "/images/bg-watermark.png",
  food: {
    bualoy: "/images/food-bualoy.png",
    chaokuay: "/images/food-chaokuay.png",
    tubtim: "/images/food-tubtim.png",
    soymilk: "/images/food-soymilk.png",
    dessert: "/images/food-dessert.png",
  },
  topping: {
    redbean: "/images/topping-redbean.png",
    foithong: "/images/topping-foithong.png",
    coconut: "/images/topping-coconut.png",
  },
} as const;

import type { CategoryId } from "../types";

export function foodImageByCategory(category: CategoryId): string {
  return images.food[category];
}
