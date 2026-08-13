/** หน้า legacy ตัวอย่างครัว ไม่ได้ถูก route หลักใช้; หน้าจริงอยู่ pages/staff/kitchen */
import { Check } from "lucide-react";
import { images } from "../../data/images";

const sampleOrder = {
  table: "A05",
  datetime: "15-05-2024 : 20:30",
  items: [
    { name: "บัวลอยนมสด", qty: 1, price: 35, image: images.food.bualoy },
    { name: "ฝอยทอง", qty: 1, price: 10, image: images.topping.foithong },
  ],
  total: 45,
};

function OrderCard({
  order,
  actions,
  faded,
  done,
}: {
  order: typeof sampleOrder;
  actions?: boolean;
  faded?: boolean;
  done?: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl bg-white p-4 shadow-sm border border-gray-100 mb-3 ${
        faded ? "opacity-50" : ""
      }`}
    >
      {done && (
        <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white">
          <Check className="w-4 h-4" />
        </div>
      )}
      <p className="text-sm font-semibold">Table: {order.table}</p>
      <p className="text-xs text-gray-500 mb-3">{order.datetime}</p>
      {order.items.map((item) => (
        <div key={item.name} className="flex gap-2 text-sm mb-2">
          <img src={item.image} alt="" className="w-10 h-10 rounded-full object-cover" />
          <span className="flex-1">
            {item.name} {item.qty} $ {item.price} บาท
          </span>
        </div>
      ))}
      <p className="font-bold text-sm mt-2">$ {order.total.toFixed(2)}</p>
      {actions && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            className="flex-1 rounded-lg bg-green-500 py-2 text-xs font-medium text-white"
          >
            ทำเสร็จแล้ว
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-brand py-2 text-xs font-medium text-white"
          >
            ยกเลิก
          </button>
        </div>
      )}
    </div>
  );
}

export function KitchenPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">เจ้าหน้าที่ห้องครัว</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-center mb-3 text-gray-700">
            รายการออเดอร์
          </h2>
          <OrderCard order={sampleOrder} actions />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-center mb-3 text-gray-700">
            พร้อมเสิร์ฟ
          </h2>
          <OrderCard order={sampleOrder} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-center mb-3 text-gray-700">
            เสิร์ฟแล้ว
          </h2>
          <OrderCard order={sampleOrder} faded done />
        </div>
      </div>
    </div>
  );
}
