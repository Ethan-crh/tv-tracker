"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertIcon, CheckIcon } from "@/components/Icons";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, kind, message }]);
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, DURATION_MS);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-[120] flex flex-col items-center gap-2 px-4 sm:bottom-8"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              role="status"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="glass-dark pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full py-2.5 pl-2.5 pr-4 text-[14px] font-medium text-white shadow-float"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  toast.kind === "error" ? "bg-[#ff453a]" : "bg-success"
                }`}
              >
                {toast.kind === "error" ? (
                  <AlertIcon size={13} strokeWidth={2.6} />
                ) : (
                  <CheckIcon size={13} />
                )}
              </span>
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans <ToastProvider>.");
  return ctx;
}
