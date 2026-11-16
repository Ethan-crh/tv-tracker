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

const DURATION_MS = 3600;

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
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[120] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              role="status"
              initial={{ opacity: 0, y: 24, scale: 0.92, rotate: -2 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className={`panel pointer-events-auto flex max-w-sm items-center gap-2.5 px-4 py-2.5 text-sm font-medium ${
                toast.kind === "error" ? "bg-accent text-white" : "bg-sun"
              }`}
            >
              {toast.kind === "error" ? (
                <AlertIcon size={18} className="shrink-0" />
              ) : (
                <CheckIcon size={18} className="shrink-0" />
              )}
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
