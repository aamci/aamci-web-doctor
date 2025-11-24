'use client';
import { createContext, useContext, useRef, useState } from 'react';

type ToastType = 'success' | 'error';
type Toast = { id: string; msg: string; type: ToastType };

const Ctx = createContext<{ toast: (m: string, t?: ToastType) => void } | null>(null);

function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const lastRef = useRef<{ msg: string; at: number } | null>(null);

  function toast(msg: string, type: ToastType = 'success') {
    const now = Date.now();
    if (lastRef.current && lastRef.current.msg === msg && now - lastRef.current.at < 400) return;
    lastRef.current = { msg, at: now };

    const id = uid();
    setItems(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 3000);
  }

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', right: 16, bottom: 16, display: 'grid', gap: 8, zIndex: 60 }}>
        {items.map(i => (
          <div
            key={i.id}
            className="card"
            style={{
              background: i.type === 'success' ? '#ecfdf5' : '#fef2f2',
              borderColor: i.type === 'success' ? '#a7f3d0' : '#fecaca',
              color: i.type === 'success' ? '#065f46' : '#991b1b',
              padding: '10px 12px',
            }}
          >
            {i.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('ToastHost missing');
  return ctx;
}