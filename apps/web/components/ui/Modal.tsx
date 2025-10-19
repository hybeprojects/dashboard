import { ReactNode } from 'react';

type Props = { open: boolean; onClose: () => void; title?: string; children: ReactNode };
export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal
    >
      <div className="card-surface max-w-lg w-full p-4">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <div>{children}</div>
        <div className="mt-4 flex justify-end">
          <button
            className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
