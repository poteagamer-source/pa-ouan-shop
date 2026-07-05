import type {
  CartItem,
  CategoryId,
  Order,
  OrderStatus,
  Product,
  SalesOrder,
  SalesSummary,
  StockItem,
  Topping,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `คำขอไป ${path} ล้มเหลว (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ไม่มี JSON body ก็ใช้ข้อความ default
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${qs.toString()}`;
}

/* ------------------------------- categories ------------------------------ */

export function fetchCategories(): Promise<{ id: CategoryId; label: string }[]> {
  return request("/categories");
}

/* -------------------------------- products ------------------------------- */

export function fetchProducts(params?: { category?: CategoryId; active?: boolean }): Promise<Product[]> {
  return request(`/products${toQueryString({ category: params?.category, active: params?.active })}`);
}

export function fetchProduct(id: string): Promise<Product> {
  return request(`/products/${id}`);
}

export function createProduct(payload: {
  id: string;
  name: string;
  price: number;
  category: CategoryId;
  image?: string;
  bestseller?: boolean;
  recommended?: boolean;
}): Promise<Product> {
  return request("/products", { method: "POST", body: JSON.stringify(payload) });
}

export function updateProduct(
  id: string,
  payload: Partial<{
    name: string;
    price: number;
    category: CategoryId;
    image: string;
    bestseller: boolean;
    recommended: boolean;
    active: boolean;
  }>,
): Promise<Product> {
  return request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteProduct(id: string): Promise<void> {
  return request(`/products/${id}`, { method: "DELETE" });
}

/* -------------------------------- toppings ------------------------------- */

export function fetchToppings(tier?: 5 | 10): Promise<Topping[]> {
  return request(`/toppings${toQueryString({ tier })}`);
}

/* ---------------------------------- stock --------------------------------- */

export function fetchStock(): Promise<StockItem[]> {
  return request("/stock");
}

export function updateStock(
  productId: string,
  payload: Partial<{ stockQty: number; unit: string; active: boolean }>,
): Promise<StockItem> {
  return request(`/stock/${productId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function adjustStock(productId: string, delta: number): Promise<{ productId: string; stockQty: number }> {
  return request(`/stock/${productId}/adjust`, { method: "PATCH", body: JSON.stringify({ delta }) });
}

/* ---------------------------------- orders -------------------------------- */

export function fetchOrders(params?: { status?: OrderStatus[]; date?: string; table?: string }): Promise<Order[]> {
  return request(
    `/orders${toQueryString({ status: params?.status?.join(","), date: params?.date, table: params?.table })}`,
  );
}

export function fetchOrder(id: string): Promise<Order> {
  return request(`/orders/${id}`);
}

export interface CreateOrderPayload {
  table: string;
  note?: "เย็น" | "ร้อน";
  items: CartItem[];
}

/** แปลง CartItem (ฝั่ง context ตะกร้า) ให้เป็น body ที่ backend ต้องการตอนสร้างออเดอร์ */
export function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const body = {
    table: payload.table,
    note: payload.note,
    items: payload.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      basePrice: item.basePrice,
      quantity: item.quantity,
      temperature: item.temperature,
      toppings: item.toppings,
    })),
  };
  return request("/orders", { method: "POST", body: JSON.stringify(body) });
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function attachSlip(id: string, slipImage: string): Promise<Order> {
  return request(`/orders/${id}/slip`, { method: "PATCH", body: JSON.stringify({ slipImage }) });
}

export function verifyPayment(id: string): Promise<Order> {
  return request(`/orders/${id}/verify-payment`, { method: "PATCH" });
}

/* ---------------------------------- sales --------------------------------- */

export function fetchSales(params?: { from?: string; to?: string; table?: string }): Promise<SalesOrder[]> {
  return request(`/sales${toQueryString({ from: params?.from, to: params?.to, table: params?.table })}`);
}

export function fetchSalesSummary(params?: { from?: string; to?: string }): Promise<SalesSummary> {
  return request(`/sales/summary${toQueryString({ from: params?.from, to: params?.to })}`);
}
