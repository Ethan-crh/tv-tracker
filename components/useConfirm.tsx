"use client";

import { useCallback, useRef, useState } from "react";
import Modal from "@/components/Modal";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Deuxième action possible, entre « Annuler » et la confirmation. */
  alternativeLabel?: string;
  danger?: boolean;
};

export type ConfirmResult = "confirm" | "alternative" | "cancel";

/**
 * Boîte de confirmation utilisable comme une promesse :
 *   const answer = await confirm({ title, message });
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolver = useRef<((value: ConfirmResult) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<ConfirmResult>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((result: ConfirmResult) => {
    setOpen(false);
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  const cancel = useCallback(() => settle("cancel"), [settle]);

  const dialog = (
    <Modal
      open={open}
      onClose={cancel}
      label={options?.title || "Confirmation"}
      className="max-w-[420px] p-6 sm:p-7"
    >
      {options && (
        <>
          <h3 className="section-title text-[19px]">{options.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {options.message}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button onClick={cancel} className="btn">
              {options.cancelLabel || "Annuler"}
            </button>
            {options.alternativeLabel && (
              <button onClick={() => settle("alternative")} className="btn">
                {options.alternativeLabel}
              </button>
            )}
            <button
              onClick={() => settle("confirm")}
              className={`btn ${options.danger ? "btn-danger" : "btn-primary"}`}
            >
              {options.confirmLabel || "Confirmer"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );

  return { confirm, dialog };
}
