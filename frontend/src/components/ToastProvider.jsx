import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { ToastContext } from "./toastContext.js";

const toastStyles = {
  success: {
    icon: CheckCircle2,
    card: "border-emerald-200 bg-emerald-50 text-emerald-900",
    iconWrap: "bg-emerald-500 text-white",
  },
  error: {
    icon: CircleAlert,
    card: "border-rose-200 bg-rose-50 text-rose-900",
    iconWrap: "bg-rose-500 text-white",
  },
  info: {
    icon: Info,
    card: "border-sky-200 bg-sky-50 text-sky-900",
    iconWrap: "bg-sky-500 text-white",
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      removeToast(id);
    }, 3200);
  }, [removeToast]);

  const value = useMemo(
    () => ({
      showToast,
      showSuccess: (message) => showToast(message, "success"),
      showError: (message) => showToast(message, "error"),
      showInfo: (message) => showToast(message, "info"),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] px-3 sm:right-4 sm:left-auto sm:top-4 sm:w-[380px] sm:px-0">
        <div className="space-y-3">
          {toasts.map((toast) => {
            const tone = toastStyles[toast.type] || toastStyles.info;
            const Icon = tone.icon;

            return (
              <div
                key={toast.id}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${tone.card}`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.iconWrap}`}>
                  <Icon size={18} />
                </div>
                <p className="flex-1 text-sm font-medium leading-6">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-full p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
                  aria-label="Close notification"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
