import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { openNavigation } from '../utils/navigation.js';

export default function NavigateButton({ placeName, className = '' }) {
  const { showToast } = useToast();

  function handleNavigate() {
    const opened = openNavigation(placeName);
    if (opened) {
      showToast('Opening navigation...', 'info');
    } else {
      showToast('Location name is missing', 'error');
    }
  }

  return (
    <button
      className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-sky-500 hover:to-emerald-400 hover:shadow-xl active:translate-y-0 ${className}`}
      onClick={handleNavigate}
      type="button"
    >
      <Navigation className="h-4 w-4" />
      <MapPin className="h-4 w-4 opacity-90" />
      Navigate
    </button>
  );
}
