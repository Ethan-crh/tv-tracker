"use client";

import { useState, useCallback, useRef } from "react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | undefined>(undefined);

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const normalized: ConfirmOptions =
      typeof opts === "string" ? { message: opts } : opts;
    setOptions(normalized);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function handle(result: boolean) {
    setOptions(null);
    resolver.current?.(result);
  }

  const dialog = options ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#111111]/60"
        onClick={() => handle(false)}
      />
      <div className="manga-panel relative w-full max-w-sm rotate-[-1deg] bg-[#F7F5F0] p-6">
        {options.title && (
          <h3 className="font-display text-lg uppercase mb-2 text-[#111111]">
            {options.title}
          </h3>
        )}
        <p className="text-sm text-[#3a3a3a] mb-6">{options.message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => handle(false)}
            className="manga-btn bg-white px-4 py-2 text-xs font-bold text-[#111111]"
          >
            {options.cancelLabel || "Annuler"}
          </button>
          <button
            onClick={() => handle(true)}
            className={`manga-btn px-4 py-2 text-xs font-bold text-white ${
              options.danger ? "bg-[#E1263F]" : "bg-[#111111]"
            }`}
          >
            {options.confirmLabel || "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}