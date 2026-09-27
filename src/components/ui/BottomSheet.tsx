"use client";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { steam } from "@/lib/motion";

/** Native-feeling bottom sheet: drag-to-dismiss, scrim, safe-area aware. */
export function BottomSheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode }) {
  const controls = useDragControls();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <motion.button aria-label="Close" className="absolute inset-0 bg-[var(--scrim)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[var(--radius-sheet)] border-t border-line bg-raised"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.42, ease: steam }}
            drag="y" dragControls={controls} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
          >
            <div className="flex cursor-grab touch-none flex-col items-center pt-3 pb-1" onPointerDown={(e) => controls.start(e)}>
              <span className="h-1.5 w-11 rounded-full bg-line" />
              {title && <h2 className="mt-3 w-full px-5 font-display text-xl font-semibold">{title}</h2>}
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">{children}</div>
            {footer && <div className="border-t border-line px-5 pt-3" style={{ paddingBottom: "calc(var(--safe-b) + 14px)" }}>{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
