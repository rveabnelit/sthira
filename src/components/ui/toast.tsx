"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Check, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "default" | "success" | "error";
type Toast = { id: number; message: string; tone: ToastTone };

const ToastContext = createContext<{ push: (message: string, tone?: ToastTone) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: ToastTone = "default") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[0_18px_40px_-30px_rgba(36,57,47,0.5)] animate-fade-up",
              toast.tone === "error"
                ? "border-[#d9b7ad] bg-[#fbf1ee] text-[#7e3a2c]"
                : toast.tone === "success"
                  ? "border-[#c6d0bf] bg-[#f3f6ef] text-[#3d553f]"
                  : "border-line bg-paper text-ink",
            )}
          >
            <span className="mt-0.5 shrink-0">
              {toast.tone === "success" ? <Check className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </span>
            <p className="flex-1 leading-relaxed">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { push: (message: string) => console.log("[toast]", message) };
  }
  return context;
}

export function ToastClose() {
  return <X className="h-4 w-4" />;
}
