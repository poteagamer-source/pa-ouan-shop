import { Link, useSearchParams } from "react-router-dom";
import { QrCode, Smartphone } from "lucide-react";
import { SHOP_SHORT } from "../config/constants";
import { images } from "../data/images";
import { TABLE_IDS, staffPortalUrl, tableOrderUrl } from "../config/qrRoutes";

export function RoleSelect() {
  const [params] = useSearchParams();
  const error = params.get("error");
  const hint = params.get("hint");

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-brand-light to-white p-6">
      <div className="text-center mb-6">
        <img
          src={images.logoMascot}
          alt={SHOP_SHORT}
          className="w-28 h-28 mx-auto mb-4 rounded-full object-cover shadow-lg border-4 border-white"
        />
        <h1 className="text-2xl font-bold text-brand">{SHOP_SHORT}</h1>
        <p className="text-gray-600 mt-1 text-sm">ระบบสั่งซื้อและจัดการร้าน</p>
      </div>

      {(error === "invalid-table" || hint === "scan-table-qr") && (
        <div className="mb-4 max-w-sm w-full rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
          {error === "invalid-table"
            ? "QR โต๊ะไม่ถูกต้อง กรุณาสแกน QR ที่ติดไว้ที่โต๊ะของคุณ"
            : "กรุณาสแกน QR Code ที่โต๊ะเพื่อสั่งอาหาร"}
        </div>
      )}

      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-md border border-orange-100 mb-4">
        <div className="flex items-center gap-2 text-brand font-semibold text-sm mb-2">
          <QrCode className="w-4 h-4" />
          ลูกค้า — สแกน QR ที่โต๊ะ
        </div>
        <p className="text-xs text-gray-500 mb-3">
          แต่ละโต๊ะมี QR แยกกัน ระบบจะรู้เลขโต๊ะอัตโนมัติ
        </p>
        <p className="text-[11px] text-gray-400 font-mono mb-3 break-all">
          ตัวอย่าง: {tableOrderUrl("A05")}
        </p>
        <p className="text-xs text-gray-500 mb-2">ทดสอบ (เลือกโต๊ะ):</p>
        <div className="flex flex-wrap gap-2">
          {TABLE_IDS.slice(0, 5).map((t) => (
            <Link
              key={t}
              to={`/order/${t}/menu`}
              className="rounded-full bg-brand-light text-brand px-3 py-1 text-xs font-medium hover:bg-brand hover:text-white transition-colors"
            >
              โต๊ะ {t}
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-md border border-gray-200">
        <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm mb-2">
          <Smartphone className="w-4 h-4" />
          พนักงาน — สแกน QR แยก
        </div>
        <p className="text-xs text-gray-500 mb-3">
          QR พนักงานไม่ผูกโต๊ะ ใช้คนละอันกับลูกค้า
        </p>
        <Link
          to="/staff-entry"
          className="block w-full text-center rounded-lg bg-gray-800 text-white py-2.5 text-sm font-medium hover:bg-gray-700"
        >
          เข้าระบบพนักงาน
        </Link>
        <p className="text-[11px] text-gray-400 font-mono mt-2 break-all text-center">
          {staffPortalUrl()}
        </p>
      </div>
    </div>
  );
}
