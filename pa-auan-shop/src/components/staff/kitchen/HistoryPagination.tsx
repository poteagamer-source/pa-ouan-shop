import { useKitchenOrders } from '../../../context/KitchenOrdersContext';

export function HistoryPagination() {
  const { historyPage, historyTotal, historyLoading, setHistoryPage } = useKitchenOrders();
  const pages = Math.max(1, Math.ceil(historyTotal / 50));
  return <div className="flex items-center justify-between gap-3 mt-3 text-xs text-gray-600" aria-label="หน้าประวัติการเสิร์ฟ">
    <button className="rounded border px-3 py-2 disabled:opacity-40" disabled={historyLoading || historyPage === 0}
      onClick={() => setHistoryPage(historyPage - 1)}>ก่อนหน้า</button>
    <span aria-live="polite">{historyLoading ? 'กำลังโหลด...' : `หน้า ${historyPage + 1}/${pages} · ทั้งหมด ${historyTotal} รายการ`}</span>
    <button className="rounded border px-3 py-2 disabled:opacity-40" disabled={historyLoading || historyPage + 1 >= pages}
      onClick={() => setHistoryPage(historyPage + 1)}>ถัดไป</button>
  </div>;
}
