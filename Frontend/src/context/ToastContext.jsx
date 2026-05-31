import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const toastStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-100',
  info: 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
};

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function removeToast(id) {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }

  function showToast(message, type = 'info') {
    const id = crypto.randomUUID();
    setToasts((currentToasts) => [...currentToasts, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type] || Info;

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur transition-all duration-300 ${toastStyles[toast.type] || toastStyles.info}`}
            >
              <Icon className="mt-0.5 h-5 w-5 flex-none" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                aria-label="Close notification"
                className="rounded-full p-1 opacity-70 transition-opacity duration-200 hover:opacity-100"
                onClick={() => removeToast(toast.id)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
