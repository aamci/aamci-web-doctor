'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, Loader2, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'promise';

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

let toasts: ToastData[] = [];
let listeners: Array<(toasts: ToastData[]) => void> = [];

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]));
}

export const toast = {
  success: (message: string, options?: { description?: string; duration?: number }) => {
    const id = Math.random().toString(36).substring(7);
    toasts.push({ id, type: 'success', message, ...options, duration: options?.duration || 3000 });
    notifyListeners();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    }, options?.duration || 3000);
  },
  error: (message: string, options?: { description?: string; duration?: number }) => {
    const id = Math.random().toString(36).substring(7);
    toasts.push({ id, type: 'error', message, ...options, duration: options?.duration || 4000 });
    notifyListeners();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    }, options?.duration || 4000);
  },
  info: (message: string, options?: { description?: string; duration?: number }) => {
    const id = Math.random().toString(36).substring(7);
    toasts.push({ id, type: 'info', message, ...options, duration: options?.duration || 3000 });
    notifyListeners();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    }, options?.duration || 3000);
  },
  warning: (message: string, options?: { description?: string; duration?: number }) => {
    const id = Math.random().toString(36).substring(7);
    toasts.push({ id, type: 'warning', message, ...options, duration: options?.duration || 3500 });
    notifyListeners();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    }, options?.duration || 3500);
  },
  promise: async <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    const id = Math.random().toString(36).substring(7);
    toasts.push({ id, type: 'promise', message: options.loading, duration: 0 });
    notifyListeners();

    try {
      const data = await promise;
      toasts = toasts.filter((t) => t.id !== id);
      const successMsg = typeof options.success === 'function' ? options.success(data) : options.success;
      toast.success(successMsg);
      return data;
    } catch (error) {
      toasts = toasts.filter((t) => t.id !== id);
      const errorMsg = typeof options.error === 'function' ? options.error(error) : options.error;
      toast.error(errorMsg);
      throw error;
    }
  },
};

function getToastIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case 'promise':
      return <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />;
  }
}

function getToastStyles(type: ToastType) {
  switch (type) {
    case 'success':
      return 'bg-white border-green-200';
    case 'error':
      return 'bg-white border-red-200';
    case 'info':
      return 'bg-white border-blue-200';
    case 'warning':
      return 'bg-white border-orange-200';
    case 'promise':
      return 'bg-white border-gray-200';
  }
}

export function Toaster() {
  const [toastList, setToastList] = useState<ToastData[]>([]);

  useEffect(() => {
    listeners.push(setToastList);
    return () => {
      listeners = listeners.filter((l) => l !== setToastList);
    };
  }, []);

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toastList.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-start gap-3
            px-4 py-3
            rounded-lg border-2 shadow-lg
            min-w-[320px] max-w-[420px]
            animate-in slide-in-from-top-2 duration-300
            ${getToastStyles(toast.type)}
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getToastIcon(toast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {toast.message}
            </p>
            {toast.description && (
              <p className="text-sm text-gray-600 mt-1">
                {toast.description}
              </p>
            )}
          </div>
          {toast.type !== 'promise' && (
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
