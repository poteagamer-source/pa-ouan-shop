import { QrCode } from "lucide-react";
import {
  TABLE_IDS,
  staffPortalUrl,
  tableOrderUrl,
} from "../../config/qrRoutes";

function QrCard({
  title,
  subtitle,
  url,
  variant,
}: {
  title: string;
  subtitle: string;
  url: string;
  variant: "customer" | "staff";
}) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-sm border ${
        variant === "customer" ? "border-orange-200" : "border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            variant === "customer"
              ? "bg-brand-light text-brand"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {variant === "customer" ? "ลูกค้า" : "พนักงาน"}
        </span>
      </div>
      <img src={qrSrc} alt={`QR ${title}`} className="mx-auto w-[180px] h-[180px]" />
      <p className="mt-3 text-[11px] text-gray-500 break-all text-center font-mono">
        {url}
      </p>
    </div>
  );
}

export function QrCodesPage() {
  const staffUrl = staffPortalUrl();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-2">
        <QrCode className="w-6 h-6 text-brand" />
        <h1 className="text-xl font-bold text-gray-800">จัดการ QR Code</h1>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        QR ลูกค้าติดประจำโต๊ะ (มีเลขโต๊ะในลิงก์) · QR พนักงานแยกต่างหาก
      </p>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          QR พนักงาน / ผู้จัดการ (สแกนครั้งเดียวต่อจุดทำงาน)
        </h2>
        <div className="max-w-xs">
          <QrCard
            title="พนักงาน & ผู้จัดการ"
            subtitle="สแกนแล้วเลือกหน้าที่ — ไม่ผูกโต๊ะ"
            url={staffUrl}
            variant="staff"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          QR ลูกค้า — ติดที่โต๊ะ (แต่ละโต๊ะคนละ QR)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TABLE_IDS.map((tableId) => (
            <QrCard
              key={tableId}
              title={`โต๊ะ ${tableId}`}
              subtitle="สแกนแล้วสั่งอาหาร — ระบบรู้เลขโต๊ะอัตโนมัติ"
              url={tableOrderUrl(tableId)}
              variant="customer"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
