import type { ReactNode } from "react";
import { images } from "../../data/images";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#fafafa] relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.12]"
        style={{ backgroundImage: `url(${images.bgWatermark})` }}
      />
      <div className="relative z-10 pb-8">{children}</div>
    </div>
  );
}
