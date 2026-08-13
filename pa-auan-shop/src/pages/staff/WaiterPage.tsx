/** หน้า legacy ตัวอย่าง waiter ไม่ได้ถูก route หลักใช้; หน้าจริงอยู่ pages/staff/waiter */
import { Check } from "lucide-react";
import { images } from "../../data/images";

const order = {
  table: "A01",
  datetime: "10-05-2024 : 17:30",
  item: "บัวลอยนมสด",
  qty: 1,
  price: 35,
  total: 35,
  image: images.food.bualoy,
};

export function WaiterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-8">พนักงานเสิร์ฟ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        <div>
          <h2 className="text-center text-sm font-semibold text-gray-700 mb-4">
            รายการออเดอร์ที่ต้องเสิร์ฟ
          </h2>
          <div className="rounded-2xl bg-white p-5 shadow-md border border-gray-100">
            <p className="text-sm font-semibold">Table: {order.table}</p>
            <p className="text-xs text-gray-500 mb-4">{order.datetime}</p>
            <div className="flex gap-3 mb-3">
              <img
                src={order.image}
                alt=""
                className="w-14 h-14 rounded-full object-cover"
              />
              <p className="text-sm flex-1">
                {order.item} {order.qty} $ {order.price} บาท
              </p>
            </div>
            <p className="text-brand font-bold text-sm mb-4">
              รวม $ {order.total.toFixed(2)}
            </p>
            <button
              type="button"
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white"
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-center text-sm font-semibold text-gray-700 mb-4">
            เสิร์ฟแล้ว
          </h2>
          <div className="relative rounded-2xl bg-white p-5 shadow-md border border-gray-100 opacity-50">
            <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold">Table: {order.table}</p>
            <p className="text-xs text-gray-500 mb-4">{order.datetime}</p>
            <div className="flex gap-3">
              <img
                src={order.image}
                alt=""
                className="w-14 h-14 rounded-full object-cover"
              />
              <p className="text-sm flex-1">
                {order.item} {order.qty} $ {order.price} บาท
              </p>
            </div>
            <p className="text-brand font-bold text-sm mt-3">
              รวม $ {order.total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
