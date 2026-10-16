import { BadgePlus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function NewProductBadge() {
  const { t } = useLanguage();
  return <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-1 text-[10px] font-bold text-white shadow-sm" aria-label={t('สินค้าใหม่', 'New product')}>
    <BadgePlus className="h-3 w-3" aria-hidden="true" />{t('ใหม่', 'NEW')}
  </span>;
}
