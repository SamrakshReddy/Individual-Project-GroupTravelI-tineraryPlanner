import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileText,
  Globe2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Pencil,
  Phone,
  Shield,
  Sparkles,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ChangePasswordModal from '../components/profile/ChangePasswordModal.jsx';
import DeleteAccountModal from '../components/profile/DeleteAccountModal.jsx';
import ProfileEditModal from '../components/profile/ProfileEditModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getProfile, logoutAllSessions } from '../services/authService.js';
import { formatDate, getErrorMessage } from '../utils/formatters.js';
import {
  activityOptions,
  budgetOptions,
  formatLastLogin,
  formatRole,
  getAccountSummary,
  getInitials,
  loadNotificationSettings,
  loadPersonalInfo,
  loadTravelPreferences,
  profileNotificationsKey,
  profilePersonalKey,
  profileTravelPrefsKey,
  saveNotificationSettings,
  savePersonalInfo,
  saveTravelPreferences,
  travelStyleOptions,
} from '../utils/profileHelpers.js';
import { useTrips } from '../utils/useTrips.js';

const NOTIFICATION_TOGGLES = [
  { key: 'tripReminders', label: 'Trip reminders', description: 'Get reminded before upcoming trips and activities.' },
  { key: 'budgetAlerts', label: 'Budget alerts', description: 'Notify when a trip approaches or exceeds its budget.' },
  { key: 'aiPlannerSuggestions', label: 'AI Planner suggestions', description: 'Highlights and tips from the AI trip planner.' },
  { key: 'expenseAlerts', label: 'Expense alerts', description: 'Alerts when new group expenses are added.' },
];

const CONNECTED_SERVICES = [
  { id: 'pdf', label: 'PDF export', description: 'Download itinerary summaries', enabled: false },
  { id: 'ai', label: 'AI Planner', description: 'Generate smart travel plans', enabled: true },
];

export default function Profile() {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const { trips, isLoading: tripsLoading } = useTrips();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState(() => loadPersonalInfo());
  const [travelPrefs, setTravelPrefs] = useState(() => loadTravelPreferences());
  const [notifications, setNotifications] = useState(() => loadNotificationSettings());
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  useEffect(() => {
    async function loadUser() {
      setIsLoading(true);
      try {
        const response = await getProfile();
        setUser(response.data?.user || response.data?.data || null);
      } catch (error) {
        showToast(getErrorMessage(error, 'Could not load profile'), 'error');
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [showToast]);

  const fullName = personalInfo.displayName || user?.username || 'Traveler';
  const summary = useMemo(() => getAccountSummary(trips), [trips]);

  function handleSavePersonalInfo(nextInfo) {
    savePersonalInfo(nextInfo);
    setPersonalInfo(nextInfo);
    showToast('Personal information saved', 'success');
  }

  function handleSaveTravelPrefs() {
    setIsSavingPrefs(true);
    saveTravelPreferences(travelPrefs);
    setTimeout(() => {
      setIsSavingPrefs(false);
      showToast('Travel preferences saved', 'success');
    }, 250);
  }

  function handleNotificationToggle(key) {
    setNotifications((current) => {
      const next = { ...current, [key]: !current[key] };
      saveNotificationSettings(next);
      return next;
    });
  }

  function toggleActivity(activity) {
    setTravelPrefs((current) => {
      const selected = current.favoriteActivities || [];
      const nextActivities = selected.includes(activity)
        ? selected.filter((item) => item !== activity)
        : [...selected, activity];
      return { ...current, favoriteActivities: nextActivities };
    });
  }

  function handleChangePassword({ currentPassword, newPassword, confirmPassword }) {
    if (!currentPassword || !newPassword) {
      showToast('Please fill in all password fields', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    showToast('Password change is not available yet. Contact support or re-register.', 'error');
  }

  async function handleLogoutAllDevices() {
    setIsLoggingOutAll(true);
    try {
      await logoutAllSessions();
      showToast('Signed out from all devices', 'success');
      logout();
    } catch (error) {
      showToast(getErrorMessage(error, 'Could not sign out from all devices'), 'error');
    } finally {
      setIsLoggingOutAll(false);
    }
  }

  function handleDeleteAccount() {
    [
      profilePersonalKey,
      profileTravelPrefsKey,
      profileNotificationsKey,
      'travelPlannerFavoriteDestinations',
      'travelPlannerProfileDisplay',
      'travelPlannerProfilePreferences',
    ].forEach((key) => localStorage.removeItem(key));

    showToast('Local account data cleared. Full account deletion requires server support.', 'success');
    logout();
  }

  if (isLoading || tripsLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      <header className="travel-hero overflow-hidden">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-emerald-500/10 dark:from-sky-500/5 dark:to-emerald-500/5" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 flex-none items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-sky-500 to-emerald-500 text-3xl font-bold text-white shadow-xl shadow-sky-500/25 dark:border-slate-800">
                {getInitials(fullName)}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">Account profile</p>
                <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">{fullName}</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{user?.email}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Badge>{formatRole(user?.role)}</Badge>
                  <Badge icon={CalendarDays}>Member since {formatDate(user?.createdAt)}</Badge>
                </div>
              </div>
            </div>
            <button className="btn-primary shrink-0" onClick={() => setIsEditOpen(true)} type="button">
              <Pencil className="h-5 w-5" />
              Edit profile
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <SectionCard icon={User} title="Personal information">
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoItem icon={User} label="Name" value={fullName} />
              <InfoItem icon={Mail} label="Email" value={user?.email || '—'} />
              <InfoItem icon={Phone} label="Phone number" value={personalInfo.phone || 'Not set'} />
              <InfoItem icon={Globe2} label="Country" value={personalInfo.country || 'Not set'} />
              <InfoItem className="sm:col-span-2" icon={MapPin} label="Time zone" value={personalInfo.timezone || 'Not set'} />
            </dl>
            <button className="btn-secondary mt-5" onClick={() => setIsEditOpen(true)} type="button">
              <Pencil className="h-4 w-4" />
              Edit information
            </button>
          </SectionCard>

          <SectionCard icon={Sparkles} title="Travel preferences">
            <div className="mt-5 space-y-6">
              <fieldset>
                <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preferred budget</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {budgetOptions.map((option) => (
                    <ChoiceChip
                      active={travelPrefs.preferredBudget === option.value}
                      key={option.value}
                      label={option.label}
                      onClick={() => setTravelPrefs((c) => ({ ...c, preferredBudget: option.value }))}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">Travel style</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {travelStyleOptions.map((option) => (
                    <ChoiceChip
                      active={travelPrefs.travelStyle === option.value}
                      key={option.value}
                      label={option.label}
                      onClick={() => setTravelPrefs((c) => ({ ...c, travelStyle: option.value }))}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">Favorite activities</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activityOptions.map((option) => (
                    <ChoiceChip
                      active={(travelPrefs.favoriteActivities || []).includes(option.value)}
                      key={option.value}
                      label={option.label}
                      onClick={() => toggleActivity(option.value)}
                    />
                  ))}
                </div>
              </fieldset>
            </div>
            <button className="btn-primary mt-5" disabled={isSavingPrefs} onClick={handleSaveTravelPrefs} type="button">
              {isSavingPrefs ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Save preferences
            </button>
          </SectionCard>

          <SectionCard icon={Bell} title="Notification settings">
            <div className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
              {NOTIFICATION_TOGGLES.map((item) => (
                <ToggleRow
                  checked={notifications[item.key]}
                  description={item.description}
                  key={item.key}
                  label={item.label}
                  onChange={() => handleNotificationToggle(item.key)}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={Shield} title="Security settings">
            <div className="mt-5 space-y-4">
              <SecurityAction
                buttonLabel="Change"
                description="Update your account password regularly."
                icon={KeyRound}
                onClick={() => setIsPasswordOpen(true)}
                title="Change password"
              />
              <SecurityAction
                buttonLabel={isLoggingOutAll ? 'Signing out...' : 'Sign out all'}
                description={`Last login: ${formatLastLogin(user?.lastLoginAt)}`}
                icon={Monitor}
                onClick={handleLogoutAllDevices}
                title="Active sessions"
                disabled={isLoggingOutAll}
              />
              <SecurityAction
                buttonLabel="Logout"
                description="End your current session on this device."
                icon={LogOut}
                onClick={logout}
                title="Current session"
              />
            </div>
          </SectionCard>

          <SectionCard icon={AlertTriangle} title="Danger zone" variant="danger">
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Permanently remove your account and clear saved preferences from this device.
            </p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
              onClick={() => setIsDeleteOpen(true)}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </button>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <div className="travel-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Account summary</h2>
            <div className="mt-4 space-y-3">
              <SummaryItem label="Trips created" value={summary.tripsCreated} />
              <SummaryItem label="AI plans generated" value={summary.aiPlansGenerated} />
              <SummaryItem label="Saved itineraries" value={summary.savedItineraries} />
            </div>
          </div>

          <div className="travel-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Connected services</h2>
            <ul className="mt-4 space-y-3">
              {CONNECTED_SERVICES.map((service) => (
                <li className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950" key={service.id}>
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{service.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{service.description}</p>
                  </div>
                  {service.enabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <XCircle className="h-3.5 w-3.5" />
                      Soon
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              PDF export will be available in a future update.
            </p>
          </div>
        </aside>
      </div>

      <ProfileEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSavePersonalInfo}
        personalInfo={personalInfo}
        user={user}
      />
      <ChangePasswordModal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
        onSubmit={handleChangePassword}
      />
      <DeleteAccountModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        userEmail={user?.email}
      />
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, variant = 'default' }) {
  const danger = variant === 'danger';

  return (
    <section className={`travel-surface p-5 ${danger ? 'border-red-200 dark:border-red-500/30' : ''}`}>
      <h2 className={`flex items-center gap-2 text-lg font-bold ${danger ? 'text-red-700 dark:text-red-300' : 'text-slate-950 dark:text-white'}`}>
        <Icon className="h-5 w-5" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoItem({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`rounded-xl bg-slate-50 p-4 dark:bg-slate-950 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function Badge({ children, icon: Icon }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-200">
      {Icon ? <Icon className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300" /> : null}
      {children}
    </span>
  );
}

function ChoiceChip({ label, active, onClick }) {
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-sky-600 text-white shadow-md shadow-sky-500/25'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="font-semibold text-slate-950 dark:text-white">{label}</p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-sky-200 dark:focus:ring-sky-500/20 ${checked ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'}`}
        onClick={onChange}
        role="switch"
        type="button"
      >
        <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function SecurityAction({ icon: Icon, title, description, buttonLabel, onClick, disabled = false }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <button className="btn-secondary shrink-0" disabled={disabled} onClick={onClick} type="button">
        {buttonLabel}
      </button>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <span className="text-lg font-bold text-slate-950 dark:text-white">{value}</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-44 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-slate-800" />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {[1, 2, 3, 4].map((item) => <div className="h-40 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800" key={item} />)}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800" />
      </div>
    </div>
  );
}
