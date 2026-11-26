import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, X } from "lucide-react";

type Toast = { id: number; title: string; detail?: string; tone: "success" | "info" };
type Push = (title: string, detail?: string, tone?: Toast["tone"]) => void;
const ToastContext = createContext<{ push: Push }>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((title: string, detail?: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, title, detail, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6" aria-live="polite" role="status">
        {toasts.map((toast) => (
          <div key={toast.id} className="pop pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-pop">
            {toast.tone === "success" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green" aria-hidden /> : <Info className="mt-0.5 size-5 shrink-0 text-cyan" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{toast.title}</p>
              {toast.detail ? <p className="mt-0.5 text-sm text-ink-2">{toast.detail}</p> : null}
            </div>
            <button type="button" className="rounded-md p-1 text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label="Dismiss" onClick={() => setToasts((list) => list.filter((item) => item.id !== toast.id))}>
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
