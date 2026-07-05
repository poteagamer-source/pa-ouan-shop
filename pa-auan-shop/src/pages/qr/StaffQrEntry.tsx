import { Link } from "react-router-dom";
import { ChefHat, ConciergeBell, LayoutDashboard, QrCode } from "lucide-react";
import { SHOP_SHORT } from "../../config/constants";
import { images } from "../../data/images";

/** จุดเข้าจาก QR พนักงาน — แยกจาก QR ลูกค้าที่โต๊ะ */
export function StaffQrEntry() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-white p-6">
      <div className="text-center mb-8">
        <img
          src={images.logoMascot}
          alt=""
          className="w-20 h-20 mx-auto mb-3 rounded-full object-cover border-2 border-white shadow"
        />
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-800 text-white text-xs px-3 py-1 mb-2">
          <QrCode className="w-3.5 h-3.5" />
          QR พนักงาน
        </div>
        <h1 className="text-xl font-bold text-gray-800">{SHOP_SHORT}</h1>
        <p className="text-sm text-gray-500 mt-1">เลือกหน้าที่ทำงานของคุณ</p>
      </div>

      <div className="grid gap-3 w-full max-w-sm">
        <Link
          to="/staff"
          className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow border border-gray-100 hover:border-brand"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">ผู้จัดการ</p>
            <p className="text-xs text-gray-500">Dashboard · จัดการเมนู</p>
          </div>
        </Link>
        <Link
          to="/staff/kitchen"
          className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow border border-gray-100 hover:border-brand"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-white">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">ห้องครัว</p>
            <p className="text-xs text-gray-500">รายการออเดอร์ · Kanban</p>
          </div>
        </Link>
        <Link
          to="/staff/waiter"
          className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow border border-gray-100 hover:border-brand"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-600 text-white">
            <ConciergeBell className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">พนักงานเสิร์ฟ</p>
            <p className="text-xs text-gray-500">รายการที่ต้องเสิร์ฟ</p>
          </div>
        </Link>
        <Link
          to="/staff/qr-codes"
          className="text-center text-xs text-brand mt-2 hover:underline"
        >
          จัดการ / พิมพ์ QR โต๊ะและพนักงาน
        </Link>
      </div>
    </div>
  );
}
