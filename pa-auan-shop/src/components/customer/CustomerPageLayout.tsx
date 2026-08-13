/** โครงหน้าลูกค้ามาตรฐาน ประกอบ MobileShell + Header + เนื้อหา + pager/bottom nav */
import type { ReactNode } from "react";
import { CustomerHeader } from "./CustomerHeader";
import { CustomerBottomNav } from "./CustomerBottomNav";
import { CustomerPagerFooter } from "./CustomerPagerFooter";
import { MobileShell } from "./MobileShell";

interface Props {
  children: ReactNode;
  showPager?: boolean;
  showHeader?: boolean;
}

export function CustomerPageLayout({ children, showPager = true, showHeader = true }: Props) {
  return (
    <MobileShell>
      {showHeader && <CustomerHeader />}
      <div className={`relative z-10 ${showPager ? "pb-40" : "pb-32"}`}>
        {children}
        {showPager && <CustomerPagerFooter />}
      </div>
      <CustomerBottomNav />
    </MobileShell>
  );
}
