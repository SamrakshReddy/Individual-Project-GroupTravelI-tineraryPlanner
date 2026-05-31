import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, userEmail }) {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

  function handleClose() {
    setConfirmText('');
    onClose();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canDelete) return;
    onConfirm();
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="travel-surface w-full max-w-md border-red-200 p-5 dark:border-red-500/30 animate-[fadeIn_0.25s_ease-out]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Delete account</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This action cannot be undone. Your local preferences will be cleared.</p>
            </div>
          </div>
          <button aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={handleClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Type <span className="font-bold text-red-600 dark:text-red-300">DELETE</span> to confirm removal for <span className="font-semibold">{userEmail || 'your account'}</span>.
          </p>
          <input
            className="field border-red-200 focus:border-red-500 focus:ring-red-100 dark:border-red-500/30 dark:focus:ring-red-500/20"
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            value={confirmText}
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button className="btn-secondary" onClick={handleClose} type="button">Cancel</button>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canDelete} type="submit">
              Delete account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
