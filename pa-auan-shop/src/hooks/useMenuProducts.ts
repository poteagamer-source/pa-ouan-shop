import { useEffect, useState } from 'react';
import { fetchProducts, subscribeToUpdates } from '../lib/api';
import type { Product } from '../types';

let cached: Product[] | null = null;
let updatedAt = 0;
let pending: Promise<Product[]> | null = null;

function loadProducts() {
  if (!pending) {
    pending = fetchProducts({ active: true }).then(products => {
      cached = products;
      updatedAt = Date.now();
      return products;
    }).finally(() => { pending = null; });
  }
  return pending;
}

export function useMenuProducts() {
  const [products, setProducts] = useState<Product[]>(cached ?? []);
  const [loading, setLoading] = useState(cached === null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let connected = false;
    let running = false;
    let dirty = false;
    const refresh = async () => {
      if (!active) return;
      if (running) { dirty = true; return; }
      running = true;
      try {
        do {
          dirty = false;
          try {
            const data = await loadProducts();
            if (active) { setProducts(data); setError(null); }
          } catch (err) {
            if (active) setError(err instanceof Error ? err.message : 'โหลดเมนูไม่สำเร็จ');
          }
        } while (dirty && active);
      } finally {
        running = false;
        if (active) setLoading(false);
      }
    };
    if (!cached || Date.now() - updatedAt >= 30000) void refresh();
    const unsubscribe = subscribeToUpdates(
      event => {
        if (event.resource === 'products' || event.resource === 'stock') void refresh();
      },
      value => {
        // Refresh on reconnect: changes may have occurred while offline.
        if (value && !connected) void refresh();
        connected = value;
      },
    );
    const timer = setInterval(() => {
      if (document.visibilityState !== 'hidden' && (!connected || Date.now() - updatedAt >= 60000)) void refresh();
    }, 15000);
    const onVisible = () => { if (document.visibilityState !== 'hidden') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      unsubscribe();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return { products, loading, error };
}
