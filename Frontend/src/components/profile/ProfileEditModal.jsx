import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { defaultPersonalInfo } from '../../utils/profileHelpers.js';

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
];

export default function ProfileEditModal({ isOpen, onClose, user, personalInfo, onSave }) {
  const [form, setForm] = useState(defaultPersonalInfo);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      displayName: personalInfo.displayName || user?.username || '',
      phone: personalInfo.phone || '',
      country: personalInfo.country || '',
      timezone: personalInfo.timezone || defaultPersonalInfo.timezone,
    });
  }, [isOpen, personalInfo, user]);

  if (!isOpen) return null;

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="travel-surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 animate-[fadeIn_0.25s_ease-out]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Edit personal information</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update your account details and contact information.</p>
          </div>
          <button aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="edit-display-name">Full name</label>
            <input className="field" id="edit-display-name" onChange={(e) => updateField('displayName', e.target.value)} value={form.displayName} />
          </div>

          <div>
            <label className="label" htmlFor="edit-email">Email</label>
            <input className="field cursor-not-allowed opacity-70" disabled id="edit-email" value={user?.email || ''} />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email is managed by your account sign-in.</p>
          </div>

          <div>
            <label className="label" htmlFor="edit-phone">Phone number</label>
            <input className="field" id="edit-phone" onChange={(e) => updateField('phone', e.target.value)} placeholder="+91 98765 43210" value={form.phone} />
          </div>

          <div>
            <label className="label" htmlFor="edit-country">Country</label>
            <input className="field" id="edit-country" onChange={(e) => updateField('country', e.target.value)} placeholder="India" value={form.country} />
          </div>

          <div>
            <label className="label" htmlFor="edit-timezone">Time zone</label>
            <select className="field" id="edit-timezone" onChange={(e) => updateField('timezone', e.target.value)} value={form.timezone}>
              {TIMEZONE_OPTIONS.map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button className="btn-secondary" onClick={onClose} type="button">Cancel</button>
            <button className="btn-primary" type="submit">Save changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
