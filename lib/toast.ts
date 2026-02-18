type ToastType = 'success' | 'error' | 'info' | 'warning';

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: 'bg-green-900/90', border: 'border-green-500/40', text: 'text-green-200' },
  error: { bg: 'bg-red-900/90', border: 'border-red-500/40', text: 'text-red-200' },
  info: { bg: 'bg-blue-900/90', border: 'border-blue-500/40', text: 'text-blue-200' },
  warning: { bg: 'bg-amber-900/90', border: 'border-amber-500/40', text: 'text-amber-200' },
};

let container: HTMLDivElement | null = null;

function getContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText =
    'position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:400px;';
  document.body.appendChild(container);
  return container;
}

export function toast(message: string, type: ToastType = 'info', duration = 4000) {
  const c = getContainer();
  const el = document.createElement('div');
  const colors = TOAST_COLORS[type];
  el.className = `${colors.bg} ${colors.border} ${colors.text} border rounded-xl px-4 py-3 text-sm shadow-lg backdrop-blur-sm pointer-events-auto transition-all duration-300 opacity-0 translate-x-4`;
  el.textContent = message;
  c.appendChild(el);

  requestAnimationFrame(() => {
    el.classList.remove('opacity-0', 'translate-x-4');
    el.classList.add('opacity-100', 'translate-x-0');
  });

  setTimeout(() => {
    el.classList.remove('opacity-100', 'translate-x-0');
    el.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

toast.success = (msg: string, duration?: number) => toast(msg, 'success', duration);
toast.error = (msg: string, duration?: number) => toast(msg, 'error', duration);
toast.info = (msg: string, duration?: number) => toast(msg, 'info', duration);
toast.warning = (msg: string, duration?: number) => toast(msg, 'warning', duration);
