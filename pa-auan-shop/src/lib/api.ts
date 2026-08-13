import type {
  CartItem,
  CategoryId,
  Order,
  FulfillmentStatus,
  Payment,
  PaymentStatus,
  Product,
  SalesOrder,
  SalesSummary,
  StockItem,
  Topping,
  ToppingStockItem,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

/* ------------------------- realtime และชนิดข้อมูลร่วม ------------------------- */

export interface RealtimeUpdate {
  resource: "products" | "categories" | "toppings" | "stock" | "orders";
  action: "created" | "updated" | "deleted";
  id: string | null;
  at: string;
}

export type StaffRole = "manager" | "kitchen" | "waiter";
export interface StaffUser { id: number; username: string; displayName: string; role: StaffRole }
export interface ManagedStaffUser extends StaffUser { active: boolean; createdAt: string }

/** Subscribe to server-side changes. Returns a cleanup function. */
export function subscribeToUpdates(onUpdate: (update: RealtimeUpdate) => void): () => void {
  const source = new EventSource(`${BASE_URL}/events`, { withCredentials: true });
  source.addEventListener("update", (event) => {
    try {
      onUpdate(JSON.parse((event as MessageEvent<string>).data) as RealtimeUpdate);
    } catch {
      // Ignore malformed events and keep the stream connected.
    }
  });
  return () => source.close();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ฟังก์ชันกลางสำหรับเรียก API: แนบ cookie, แปลง JSON และจัดรูปแบบ error
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
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

/* -------------------------- การยืนยันตัวตนพนักงาน -------------------------- */

export function loginStaff(username: string, password: string): Promise<StaffUser> {
  return request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
}

export function fetchSetupStatus(): Promise<{ setupRequired: boolean }> {
  return request("/auth/setup-status");
}

export function setupFirstManager(payload: { username: string; displayName: string; password: string }): Promise<StaffUser> {
  return request("/auth/setup", { method: "POST", body: JSON.stringify(payload) });
}

export function fetchCurrentStaff(): Promise<StaffUser> {
  return request("/auth/me");
}

export function logoutStaff(): Promise<void> {
  return request("/auth/logout", { method: "POST" });
}

export function fetchStaffUsers(): Promise<ManagedStaffUser[]> { return request("/staff-users"); }
export function createStaffUser(payload: { username: string; displayName: string; password: string; role: StaffRole }): Promise<ManagedStaffUser> {
  return request("/staff-users", { method: "POST", body: JSON.stringify(payload) });
}
export function updateStaffUser(id: number, payload: Partial<{ displayName: string; password: string; role: StaffRole; active: boolean }>): Promise<ManagedStaffUser> {
  return request(`/staff-users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

// สร้าง query string โดยตัดค่าที่ไม่ได้ระบุออก
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
  id?: string;
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

export function updateTopping(id: string, payload: Partial<{ name: string; price: number; image: string; tier: 5 | 10 }>): Promise<Topping> {
  return request(`/toppings/${id}`, { method: "PUT", body: JSON.stringify(payload) });
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

export function adjustStock(productId: string, delta: number): Promise<StockItem> {
  return request(`/stock/${productId}/adjust`, { method: "PATCH", body: JSON.stringify({ delta }) });
}

export function addProductToStock(productId: string, payload: { stockQty: number; unit: string }): Promise<StockItem> {
  return request(`/stock/${productId}`, { method: "POST", body: JSON.stringify(payload) });
}
export function removeProductFromStock(productId: string): Promise<void> { return request(`/stock/${productId}`, { method: "DELETE" }); }
export function fetchToppingStock(): Promise<ToppingStockItem[]> { return request("/stock/toppings/all"); }
export function addToppingToStock(id: string, payload: { stockQty: number; unit: string }): Promise<ToppingStockItem> { return request(`/stock/toppings/${id}`, { method: "POST", body: JSON.stringify(payload) }); }
export function updateToppingStock(id: string, payload: Partial<{ stockQty: number; unit: string; active: boolean }>): Promise<ToppingStockItem> { return request(`/stock/toppings/${id}`, { method: "PUT", body: JSON.stringify(payload) }); }
export function adjustToppingStock(id: string, delta: number): Promise<ToppingStockItem> { return request(`/stock/toppings/${id}/adjust`, { method: "PATCH", body: JSON.stringify({ delta }) }); }
export function removeToppingFromStock(id: string): Promise<void> { return request(`/stock/toppings/${id}`, { method: "DELETE" }); }

/* ---------------------------------- orders -------------------------------- */

export function fetchOrders(params?: {
  paymentStatus?: PaymentStatus[];
  fulfillmentStatus?: FulfillmentStatus[];
  date?: string;
  table?: string;
}): Promise<Order[]> {
  return request(
    `/orders${toQueryString({
      paymentStatus: params?.paymentStatus?.join(","),
      fulfillmentStatus: params?.fulfillmentStatus?.join(","),
      date: params?.date,
      table: params?.table,
    })}`,
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

export function updateOrderStatus(id: string, fulfillmentStatus: FulfillmentStatus): Promise<Order> {
  return request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ fulfillmentStatus }) });
}

export function createPaymentSession(
  orderId: string,
  payload: { provider: string; paymentMethod: string; returnPath: string },
  idempotencyKey = crypto.randomUUID(),
): Promise<Payment> {
  return request(`/orders/${orderId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export function fetchPayments(orderId: string): Promise<Payment[]> {
  return request(`/orders/${orderId}/payments`);
}

/* ---------------------------------- sales --------------------------------- */

export function fetchSales(params?: { from?: string; to?: string; table?: string; currency?: string }): Promise<SalesOrder[]> {
  return request(`/sales${toQueryString({ from: params?.from, to: params?.to, table: params?.table, currency: params?.currency })}`);
}

export function fetchSalesSummary(params?: { from?: string; to?: string; currency?: string }): Promise<SalesSummary> {
  return request(`/sales/summary${toQueryString({ from: params?.from, to: params?.to, currency: params?.currency })}`);
}
