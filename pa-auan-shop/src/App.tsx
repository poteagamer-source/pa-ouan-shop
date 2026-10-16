import { lazy, Suspense } from "react";
/** Route tree หลัก กำหนด Provider, guards และหน้าที่ role แต่ละประเภทเข้าถึงได้ */
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { StaffLayout } from "./components/staff/StaffLayout";
import { CustomerRouteGuard } from "./components/customer/CustomerRouteGuard";

import { KitchenOrdersProvider } from "./context/KitchenOrdersContext";

import { StaffRouteGuard } from "./components/staff/StaffRouteGuard";

// Load each page only when its route is visited.
const RoleSelect = lazy(() => import("./pages/RoleSelect").then(module => ({ default: module.RoleSelect })));
const CustomerQrEntry = lazy(() => import("./pages/qr/CustomerQrEntry").then(module => ({ default: module.CustomerQrEntry })));
const StaffQrEntry = lazy(() => import("./pages/qr/StaffQrEntry").then(module => ({ default: module.StaffQrEntry })));
const TableQrEntry = lazy(() => import("./pages/qr/TableQrEntry").then(module => ({ default: module.TableQrEntry })));
const HomePage = lazy(() => import("./pages/customer/HomePage").then(module => ({ default: module.HomePage })));
const ProductDetailPage = lazy(() => import("./pages/customer/ProductDetailPage").then(module => ({ default: module.ProductDetailPage })));
const CartPage = lazy(() => import("./pages/customer/CartPage").then(module => ({ default: module.CartPage })));
const PaymentPage = lazy(() => import("./pages/customer/PaymentPage").then(module => ({ default: module.PaymentPage })));
const OrderStatusPage = lazy(() => import("./pages/customer/OrderStatusPage").then(module => ({ default: module.OrderStatusPage })));
const ManagerDashboard = lazy(() => import("./pages/staff/ManagerDashboard").then(module => ({ default: module.ManagerDashboard })));
const MenuManagement = lazy(() => import("./pages/staff/MenuManagement").then(module => ({ default: module.MenuManagement })));
const KitchenHomePage = lazy(() => import("./pages/staff/kitchen/KitchenHomePage").then(module => ({ default: module.KitchenHomePage })));
const KitchenOrdersPage = lazy(() => import("./pages/staff/kitchen/KitchenOrdersPage").then(module => ({ default: module.KitchenOrdersPage })));
const KitchenCookingPage = lazy(() => import("./pages/staff/kitchen/KitchenCookingPage").then(module => ({ default: module.KitchenCookingPage })));
const KitchenReadyPage = lazy(() => import("./pages/staff/kitchen/KitchenReadyPage").then(module => ({ default: module.KitchenReadyPage })));
const WaiterTasksPage = lazy(() => import("./pages/staff/waiter/WaiterTasksPage").then(module => ({ default: module.WaiterTasksPage })));
const WaiterServedPage = lazy(() => import("./pages/staff/waiter/WaiterServedPage").then(module => ({ default: module.WaiterServedPage })));
const QrCodesPage = lazy(() => import("./pages/staff/QrCodesPage").then(module => ({ default: module.QrCodesPage })));
const PurchaseOrdersPage = lazy(() => import("./pages/staff/PurchaseOrdersPage").then(module => ({ default: module.PurchaseOrdersPage })));
const StockPage = lazy(() => import("./pages/staff/StockPage").then(module => ({ default: module.StockPage })));
const SalesReportPage = lazy(() => import("./pages/staff/SalesReportPage").then(module => ({ default: module.SalesReportPage })));
const StaffManagementPage = lazy(() => import("./pages/staff/StaffManagementPage").then(module => ({ default: module.StaffManagementPage })));

/** เส้นทางเก่าของลูกค้าให้กลับไปเริ่มจากการสแกน QR */
function LegacyCustomerRedirect() {
  return <Navigate to="/?hint=scan-table-qr" replace />;
}

export default function App() {
  return (
    // CategoriesProvider: รายการหมวดจาก API / CartProvider: ตะกร้าร่วมของ customer routes
    <CategoriesProvider>
    <CartProvider>
      <BrowserRouter>
        <Suspense fallback={<div role="status" className="p-6 text-center text-gray-500">กำลังโหลด...</div>}>
        <Routes>
          {/* หน้าเริ่มต้นสำหรับเลือกว่าจะเข้าใช้งานในบทบาทใด */}
          <Route path="/" element={<RoleSelect />} />

          {/* QR ลูกค้า — สแกนที่โต๊ะ → /order/A05 */}
          <Route path="/order/:table" element={<CustomerRouteGuard />}>
            <Route index element={<CustomerQrEntry />} />
            <Route path="menu" element={<HomePage />} />
            <Route path="product/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="status" element={<OrderStatusPage />} />
          </Route>

          {/* QR พนักงาน — แยกจากลูกค้า */}
          <Route path="/staff-entry" element={<StaffQrEntry />} />
          <Route path="/q/:token" element={<TableQrEntry />} />

          {/* ส่วนผู้จัดการ: อนุญาตเฉพาะบัญชี manager */}
          <Route element={<StaffRouteGuard allowed={["manager"]} />}>
            <Route path="/staff" element={<StaffLayout variant="manager" />}>
              <Route index element={<ManagerDashboard />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="stock" element={<StockPage />} />
              <Route path="report" element={<SalesReportPage />} />
              <Route path="qr-codes" element={<QrCodesPage />} />
              <Route path="users" element={<StaffManagementPage />} />
            </Route>
          </Route>

          {/* Provider ออเดอร์ครัววางครอบทั้งครัวและ waiter เพื่อใช้ข้อมูล realtime ชุดเดียวกัน */}
          <Route
            element={
              <KitchenOrdersProvider>
                <Outlet />
              </KitchenOrdersProvider>
            }
          >
            {/* ส่วนครัว: manager และ kitchen เข้าถึงได้ */}
            <Route element={<StaffRouteGuard allowed={["manager", "kitchen"]} />}>
              <Route path="/staff/kitchen" element={<StaffLayout variant="kitchen" showSearch={false} />}>
                <Route index element={<KitchenHomePage />} />
                <Route path="orders" element={<KitchenOrdersPage />} />
                <Route path="cooking" element={<KitchenCookingPage />} />
                <Route path="ready" element={<KitchenReadyPage />} />
              </Route>
            </Route>
            {/* ส่วนพนักงานเสิร์ฟ: manager และ waiter เข้าถึงได้ */}
            <Route element={<StaffRouteGuard allowed={["manager", "waiter"]} />}>
              <Route path="/staff/waiter" element={<StaffLayout variant="waiter" showSearch={false} />}>
                <Route index element={<WaiterTasksPage />} />
                <Route path="served" element={<WaiterServedPage />} />
              </Route>
            </Route>
          </Route>

          {/* path เดิม — บังคับให้สแกน QR */}
          <Route path="/menu" element={<LegacyCustomerRedirect />} />
          <Route path="/cart" element={<LegacyCustomerRedirect />} />
          <Route path="/payment" element={<LegacyCustomerRedirect />} />
          <Route path="/order-status" element={<LegacyCustomerRedirect />} />
          <Route path="/product/:id" element={<LegacyCustomerRedirect />} />

          {/* URL ที่ไม่รู้จักให้กลับไปหน้าเลือกบทบาท */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </CartProvider>
    </CategoriesProvider>
  );
}
