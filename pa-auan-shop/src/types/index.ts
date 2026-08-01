export type CategoryId =
  | "bualoy"
  | "chaokuay"
  | "tubtim"
  | "soymilk"
  | "dessert";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: CategoryId;
  image: string;
  bestseller?: boolean;
  recommended?: boolean;
  active?: boolean;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  basePrice: number;
  quantity: number;
  temperature: "cold" | "hot";
  toppings: { id: string; name: string; price: number }[];
}

export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "partially_refunded"
  | "refunded";

export type FulfillmentStatus = "not_started" | "queued" | "cooking" | "ready" | "served" | "cancelled";

export type PaymentAttemptStatus =
  | "created"
  | "pending"
  | "requires_action"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "partially_refunded"
  | "refunded";

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId?: string | null;
  paymentMethod?: string | null;
  status: PaymentAttemptStatus;
  amountMinor: number;
  refundedAmountMinor: number;
  currency: string;
  checkoutUrl?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
}

/** รายการสินค้า 1 บรรทัดตามที่ backend ส่งกลับมาใน order */
export interface OrderItem {
  id: number | string;
  productId: string;
  name: string;
  image?: string | null;
  basePrice: number;
  qty: number;
  temperature?: "cold" | "hot" | null;
  /** ราคารวมของบรรทัดนี้ (basePrice + topping) * qty */
  price: number;
  toppings: { id: string; name: string; price: number }[];
}

export interface Order {
  id: string;
  table: string;
  date: string;
  time: string;
  items: OrderItem[];
  total: number;
  amountMinor: number;
  currency: string;
  currencyExponent: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  latestPayment?: Payment | null;
  note?: "เย็น" | "ร้อน" | null;
  paid?: boolean;
  paymentVerified?: boolean;
  paymentProvider?: string | null;
  paidAt?: string | null;
  stepStartedAt?: string | null;
  slipImage?: string | null;
  servedAt?: string | null;
}

/** สต๊อกสินค้า (products + stock join) ตามที่ GET /api/stock ส่งกลับ */
export interface StockItem extends Product {
  stockQty: number;
  unit: string;
  active: boolean;
  status: "low" | "enough";
}

/** ออเดอร์ที่จ่ายเงินแล้ว ตามที่ GET /api/sales ส่งกลับ */
export interface SalesOrderItem {
  name: string;
  qty: number;
  price: number;
  image: string | null;
}

export interface SalesOrder {
  id: string;
  table: string;
  total: number;
  amountMinor: number;
  currency: string;
  date: string;
  time: string;
  paymentVerified: boolean;
  slipImage?: string | null;
  items: SalesOrderItem[];
}

export interface SalesSummary {
  currency: string;
  revenue: number;
  orderCount: number;
  byDay: { date: string; revenue: number; orderCount: number }[];
  byCategory: { category: CategoryId | null; revenue: number; qty: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
}
