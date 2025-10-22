import { ReactNode, useEffect, useRef } from 'react';

type Props = { open: boolean; onClose: () => void; title?: string; children: ReactNode };
export default function Modal({ open, onClose, title, children }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // focus the close button for quick keyboard access
    setTimeout(() => closeRef.current?.focus(), 0);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="card-surface max-w-lg w-full p-4">
        {title && (
          <h3 id="modal-title" className="text-lg font-semibold mb-2">
            {title}
          </h3>
        )}
        <div>{children}</div>
        <div className="mt-4 flex justify-end">
          <button
            ref={closeRef}
            className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
            aria-label="Close dialog"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
