export interface RealtimeUpdate {
  resource: 'products' | 'categories' | 'toppings' | 'stock' | 'orders';
  action: 'created' | 'updated' | 'deleted';
  id: string | null;
  at: string;
}

type Listener = { update: (event: RealtimeUpdate) => void; connection?: (connected: boolean) => void };
const listeners = new Set<Listener>();
let source: EventSource | null = null;
let connected = false;

export function subscribeToUpdates(update: Listener['update'], connection?: Listener['connection']) {
  const listener = { update, connection };
  listeners.add(listener);
  if (!source) {
    source = new EventSource(`${import.meta.env.VITE_API_URL ?? '/api'}/events`, { withCredentials: true });
    const notify = (value: boolean) => {
      connected = value;
      for (const item of listeners) item.connection?.(value);
    };
    source.onopen = () => notify(true);
    source.onerror = () => notify(false);
    source.addEventListener('update', (event) => {
      let parsed: RealtimeUpdate;
      try { parsed = JSON.parse((event as MessageEvent<string>).data); } catch { return; }
      for (const item of listeners) item.update(parsed);
    });
  }
  connection?.(connected);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      source?.close();
      source = null;
      connected = false;
    }
  };
}
