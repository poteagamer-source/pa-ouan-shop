import { useState } from "react";
import { Link } from "react-router-dom";
import { CustomerPageLayout } from "../../components/customer/CustomerPageLayout";
import { images } from "../../data/images";
import { SHOP_SHORT } from "../../config/constants";
import { useCustomerPath } from "../../hooks/useCustomerPath";

const carouselImages = [
  images.food.bualoy,
  images.food.dessert,
  images.food.chaokuay,
];

export function WelcomePage() {
  const paths = useCustomerPath();
  const [slide, setSlide] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / (el.firstElementChild?.clientWidth || 1));
    setSlide(idx);
  };

  return (
    <CustomerPageLayout showHeader={false} showPager={false}>
      <div className="flex flex-col items-center px-6 pt-14 pb-4 text-center min-h-[70dvh]">
        <div className="w-40 h-40 rounded-full bg-white shadow-md ring-4 ring-accent-blue/60 flex items-center justify-center overflow-hidden mb-4">
          <img
            src={images.logoMascot}
            alt={SHOP_SHORT}
            className="w-32 h-32 object-contain"
          />
        </div>
        <h1 className="text-lg font-bold text-gray-800 mb-8">{SHOP_SHORT}</h1>

        <Link
          to={paths.menu}
          className="rounded-full bg-accent-blue px-10 py-3 text-sm font-semibold text-gray-800 shadow-md mb-10 hover:brightness-95 transition"
        >
          สั่งอาหาร
        </Link>

        <div className="w-full mt-auto">
          <div
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar"
          >
            {carouselImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-28 h-28 rounded-xl object-cover shrink-0 snap-center shadow-sm"
              />
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {carouselImages.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === slide ? "bg-gray-900" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </CustomerPageLayout>
  );
}
