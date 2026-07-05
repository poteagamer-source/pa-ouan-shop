import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { StaffLayout } from "./components/staff/StaffLayout";
import { CustomerRouteGuard } from "./components/customer/CustomerRouteGuard";
import { RoleSelect } from "./pages/RoleSelect";
import { CustomerQrEntry } from "./pages/qr/CustomerQrEntry";
import { StaffQrEntry } from "./pages/qr/StaffQrEntry";
import { HomePage } from "./pages/customer/HomePage";
import { ProductDetailPage } from "./pages/customer/ProductDetailPage";
import { CartPage } from "./pages/customer/CartPage";
import { PaymentPage } from "./pages/customer/PaymentPage";
import { OrderStatusPage } from "./pages/customer/OrderStatusPage";
import { ManagerDashboard } from "./pages/staff/ManagerDashboard";
import { MenuManagement } from "./pages/staff/MenuManagement";
import { KitchenOrdersProvider } from "./context/KitchenOrdersContext";
import { KitchenHomePage } from "./pages/staff/kitchen/KitchenHomePage";
import { KitchenOrdersPage } from "./pages/staff/kitchen/KitchenOrdersPage";
import { KitchenCookingPage } from "./pages/staff/kitchen/KitchenCookingPage";
import { KitchenReadyPage } from "./pages/staff/kitchen/KitchenReadyPage";
import { WaiterTasksPage } from "./pages/staff/waiter/WaiterTasksPage";
import { WaiterServedPage } from "./pages/staff/waiter/WaiterServedPage";
import { QrCodesPage } from "./pages/staff/QrCodesPage";
import { PurchaseOrdersPage } from "./pages/staff/PurchaseOrdersPage";
import { StockPage } from "./pages/staff/StockPage";
import { SalesReportPage } from "./pages/staff/SalesReportPage";

/** เดิม — redirect ไปหน้าแรก (ต้องสแกน QR) */
function LegacyCustomerRedirect() {
  return <Navigate to="/?hint=scan-table-qr" replace />;
}

export default function App() {
  return (
    <CategoriesProvider>
    <CartProvider>
      <BrowserRouter>
        <Routes>
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

          <Route path="/staff" element={<StaffLayout variant="manager" />}>
            <Route index element={<ManagerDashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="report" element={<SalesReportPage />} />
            <Route path="qr-codes" element={<QrCodesPage />} />
          </Route>

          <Route
            element={
              <KitchenOrdersProvider>
                <Outlet />
              </KitchenOrdersProvider>
            }
          >
            <Route path="/staff/kitchen" element={<StaffLayout variant="kitchen" showSearch={false} />}>
              <Route index element={<KitchenHomePage />} />
              <Route path="orders" element={<KitchenOrdersPage />} />
              <Route path="cooking" element={<KitchenCookingPage />} />
              <Route path="ready" element={<KitchenReadyPage />} />
            </Route>
            <Route path="/staff/waiter" element={<StaffLayout variant="waiter" showSearch={false} />}>
              <Route index element={<WaiterTasksPage />} />
              <Route path="served" element={<WaiterServedPage />} />
            </Route>
          </Route>

          {/* path เดิม — บังคับให้สแกน QR */}
          <Route path="/menu" element={<LegacyCustomerRedirect />} />
          <Route path="/cart" element={<LegacyCustomerRedirect />} />
          <Route path="/payment" element={<LegacyCustomerRedirect />} />
          <Route path="/order-status" element={<LegacyCustomerRedirect />} />
          <Route path="/product/:id" element={<LegacyCustomerRedirect />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
    </CategoriesProvider>
  );
}
