import { useEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { uploadProductImage } from '../../lib/api';

export function ProductImageInput({ value, onChange, onBusyChange, disabled = false }: {
  value: string; onChange: (url: string) => void; onBusyChange: (busy: boolean) => void; disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [size, setSize] = useState<number | null>(null);
  useEffect(() => () => { controller.current?.abort(); }, []);
  async function upload(file?: File) {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('เลือกรูป JPEG, PNG หรือ WebP ขนาดไม่เกิน 5 MB'); return;
    }
    const request = new AbortController();
    controller.current = request;
    setBusy(true); onBusyChange(true);
    try {
      const result = await uploadProductImage(file, request.signal);
      if (!request.signal.aborted) { onChange(result.url); setSize(result.bytes); }
    } catch (reason) {
      if (!request.signal.aborted) setError(reason instanceof Error ? reason.message : 'อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      if (!request.signal.aborted) { setBusy(false); onBusyChange(false); }
    }
  }
  return <div className="sm:col-span-2 text-sm text-gray-600">
    <p className="mb-2">รูปภาพสินค้า</p>
    <div className="flex items-center gap-3">
      {value && <img src={value} alt="ตัวอย่างรูปสินค้า" className="h-20 w-20 rounded-xl border object-cover" />}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="เลือกรูปสินค้า" className="sr-only" disabled={disabled || busy} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} />
      <button type="button" disabled={disabled || busy} onClick={() => input.current?.click()} className="flex items-center gap-2 rounded-xl border border-orange-200 px-3 py-2 text-brand disabled:opacity-50"><ImagePlus className="h-4 w-4" />{busy ? 'กำลังอัปโหลด...' : value ? 'เปลี่ยนรูปภาพ' : 'เพิ่มรูปภาพ'}</button>
    </div>
    <p className="mt-2 text-xs text-gray-400">JPEG, PNG, WebP ไม่เกิน 5 MB ระบบย่อไม่เกิน 800 px และบันทึกเป็น WebP</p>
    {size !== null && <p role="status" className="mt-1 text-xs text-green-600">อัปโหลดแล้ว ({Math.ceil(size / 1024)} KB) กดบันทึกเพื่อใช้รูปกับสินค้า</p>}
    {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
  </div>;
}
