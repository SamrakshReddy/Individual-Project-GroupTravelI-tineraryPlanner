import { X } from 'lucide-react';
import { useState } from 'react';

export default function ChangePasswordModal({ isOpen, onClose, onSubmit }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  function handleClose() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ currentPassword, newPassword, confirmPassword });
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="travel-surface w-full max-w-md p-5 animate-[fadeIn_0.25s_ease-out]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Change password</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use a strong password with at least 6 characters.</p>
          </div>
          <button aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={handleClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="current-password">Current password</label>
            <input autoComplete="current-password" className="field" id="current-password" onChange={(e) => setCurrentPassword(e.target.value)} type="password" value={currentPassword} />
          </div>
          <div>
            <label className="label" htmlFor="new-password">New password</label>
            <input autoComplete="new-password" className="field" id="new-password" onChange={(e) => setNewPassword(e.target.value)} type="password" value={newPassword} />
          </div>
          <div>
            <label className="label" htmlFor="confirm-password">Confirm new password</label>
            <input autoComplete="new-password" className="field" id="confirm-password" onChange={(e) => setConfirmPassword(e.target.value)} type="password" value={confirmPassword} />
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button className="btn-secondary" onClick={handleClose} type="button">Cancel</button>
            <button className="btn-primary" type="submit">Update password</button>
          </div>
        </form>
      </div>
    </div>
  );
}
