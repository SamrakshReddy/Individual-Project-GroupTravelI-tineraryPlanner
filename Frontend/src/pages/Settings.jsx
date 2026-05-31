import {
  Bell,
  Coins,
  Compass,
  Database,
  Download,
  Eye,
  Globe,
  Lock,
  LogOut,
  Palette,
  RefreshCw,
  Shield,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ChangePasswordModal from '../components/profile/ChangePasswordModal.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getProfile } from '../services/authService.js';
import { getTrips } from '../services/tripService.js';

export default function Settings() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingSummary, setIsDownloadingSummary] = useState(false);

  // Load app preferences from localStorage, otherwise default
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('travelPlannerAppSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          budgetAlerts: parsed.budgetAlerts ?? true,
          activityReminders: parsed.activityReminders ?? true,
          upcomingTrips: parsed.upcomingTrips ?? true,
          pushNotifications: parsed.pushNotifications ?? false,
          currency: parsed.currency ?? 'INR',
          travelStyle: parsed.travelStyle ?? 'Budget',
          groupType: parsed.groupType ?? 'Friends',
          aiPlanningStyle: parsed.aiPlanningStyle ?? 'Adventure',
          aiDetailLevel: parsed.aiDetailLevel ?? 'Detailed',
        };
      } catch (e) {
        // Fallback
      }
    }
    return {
      budgetAlerts: true,
      activityReminders: true,
      upcomingTrips: true,
      pushNotifications: false,
      currency: 'INR',
      travelStyle: 'Budget',
      groupType: 'Friends',
      aiPlanningStyle: 'Adventure',
      aiDetailLevel: 'Detailed',
    };
  });

  // Sync settings state to localStorage
  useEffect(() => {
    localStorage.setItem('travelPlannerAppSettings', JSON.stringify(settings));
  }, [settings]);

  // Utility to update specific settings
  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  // Handle Export Trips
  async function handleExportTrips() {
    setIsExporting(true);
    try {
      const response = await getTrips();
      const tripsData = response.data?.data || response.data || [];
      const blob = new Blob([JSON.stringify(tripsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'travel_planner_trips_export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Trips exported successfully!', 'success');
    } catch (error) {
      showToast('Failed to export trips data', 'error');
    } finally {
      setIsExporting(false);
    }
  }

  // Handle Download Profile Summary
  async function handleDownloadProfileSummary() {
    setIsDownloadingSummary(true);
    try {
      const response = await getProfile();
      const user = response.data?.user || response.data?.data || {};

      const summaryText = `GROUP TRAVEL ITINERARY PLANNER - PROFILE SUMMARY
================================================
Generated on: ${new Date().toLocaleString()}

USER ACCOUNT:
- Username: ${user.username || 'N/A'}
- Email: ${user.email || 'N/A'}
- Member Since: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}

APPLICATION PREFERENCES:
- Theme: ${theme === 'dark' ? 'Dark' : 'Light'}
- Currency: ${settings.currency}
- Travel Style: ${settings.travelStyle}
- Group Type: ${settings.groupType}
- AI Planning Style: ${settings.aiPlanningStyle}
- AI Detail Level: ${settings.aiDetailLevel}

NOTIFICATION PREFERENCES:
- Budget Alerts: ${settings.budgetAlerts ? 'Enabled' : 'Disabled'}
- Activity Reminders: ${settings.activityReminders ? 'Enabled' : 'Disabled'}
- Upcoming Trip Notifications: ${settings.upcomingTrips ? 'Enabled' : 'Disabled'}
- Push Notifications: ${settings.pushNotifications ? 'Enabled' : 'Disabled'}
`;

      const blob = new Blob([summaryText.trim()], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile_summary_${user.username || 'user'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Profile summary downloaded successfully!', 'success');
    } catch (error) {
      showToast('Failed to download profile summary', 'error');
    } finally {
      setIsDownloadingSummary(false);
    }
  }

  // Handle Clear Local Cache
  function handleClearCache() {
    localStorage.removeItem('travelPlannerAppSettings');
    setSettings({
      budgetAlerts: true,
      activityReminders: true,
      upcomingTrips: true,
      pushNotifications: false,
      currency: 'INR',
      travelStyle: 'Budget',
      groupType: 'Friends',
      aiPlanningStyle: 'Adventure',
      aiDetailLevel: 'Detailed',
    });
    showToast('Preferences cache cleared successfully!', 'success');
  }

  // Handle Change Password (UI only)
  function handleChangePassword() {
    showToast('Password updated successfully (Simulated UI action)', 'success');
    setIsPasswordOpen(false);
  }

  // Handle Logout All Devices (UI only)
  function handleLogoutAllDevices() {
    showToast('Signed out all other sessions (Simulated UI action)', 'success');
  }

  const detailLevels = ['Basic', 'Balanced', 'Detailed'];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      {/* Sticky Header Section */}
      <div className="sticky top-[70px] z-10 -mx-4 px-4 py-4 backdrop-blur-md bg-sky-50/80 dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure your workspace preferences and travel rules.</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 self-start sm:self-auto flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" />
          Active Session Secured
        </div>
      </div>

      {/* Real-time Summary Card */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50 shadow-sm transition-all">
        <h2 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
          <Palette className="h-4 w-4" />
          Current Settings
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Currency</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{settings.currency}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Travel Style</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{settings.travelStyle}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Style</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{settings.aiPlanningStyle}</p>
          </div>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="space-y-6">
        


        {/* Notifications Group */}
        <SettingsGroup title="Notifications" subtitle="Decide how and when you receive alert notifications.">
          <div className="divide-y divide-slate-150 dark:divide-slate-800">
            <NotificationToggleRow
              icon={Bell}
              title="Budget Alerts"
              description="Notify when active group trip budgets exceed or approach limits."
              checked={settings.budgetAlerts}
              onChange={(val) => updateSetting('budgetAlerts', val)}
            />
            <NotificationToggleRow
              icon={Sparkles}
              title="Activity Reminders"
              description="Get reminders for daily scheduled activities and group updates."
              checked={settings.activityReminders}
              onChange={(val) => updateSetting('activityReminders', val)}
            />
            <NotificationToggleRow
              icon={Compass}
              title="Upcoming Trip Notifications"
              description="Get notifications a few days before a trip's start date."
              checked={settings.upcomingTrips}
              onChange={(val) => updateSetting('upcomingTrips', val)}
            />
            <NotificationToggleRow
              icon={Globe}
              title="Push Notifications"
              description="Deliver notifications in real-time through your desktop browser."
              checked={settings.pushNotifications}
              onChange={(val) => updateSetting('pushNotifications', val)}
            />
          </div>
        </SettingsGroup>

        {/* Travel Preferences Group */}
        <SettingsGroup title="Travel Preferences" subtitle="Set standard guidelines and dropdown defaults for trip planning.">
          <div className="grid gap-6 py-4 sm:grid-cols-3">
            {/* Preferred Currency dropdown */}
            <div>
              <label htmlFor="currency" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Preferred Currency
              </label>
              <div className="relative">
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => updateSetting('currency', e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-slate-700"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Travel Style dropdown */}
            <div>
              <label htmlFor="travelStyle" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Travel Style
              </label>
              <div className="relative">
                <select
                  id="travelStyle"
                  value={settings.travelStyle}
                  onChange={(e) => updateSetting('travelStyle', e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-slate-700"
                >
                  <option value="Budget">Budget</option>
                  <option value="Standard">Standard</option>
                  <option value="Luxury">Luxury</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <Sliders className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Group Type dropdown */}
            <div>
              <label htmlFor="groupType" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Group Type
              </label>
              <div className="relative">
                <select
                  id="groupType"
                  value={settings.groupType}
                  onChange={(e) => updateSetting('groupType', e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-slate-700"
                >
                  <option value="Friends">Friends</option>
                  <option value="Family">Family</option>
                  <option value="Solo">Solo</option>
                  <option value="Business">Business</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <Globe className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </SettingsGroup>

        {/* AI Planner Preferences Group */}
        <SettingsGroup title="AI Planner Preferences" subtitle="Fine-tune how the automatic AI planner builds recommendations.">
          {/* AI Planning Style */}
          <div className="py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">AI Planning Style</p>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {['Adventure', 'Relaxation', 'Cultural', 'Food Exploration'].map((style) => {
                const isActive = settings.aiPlanningStyle === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateSetting('aiPlanningStyle', style)}
                    className={`rounded-xl border p-3 flex flex-col items-center gap-1.5 text-center transition-all ${
                      isActive
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 ring-2 ring-sky-500/25'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sparkles className={`h-4.5 w-4.5 ${isActive ? 'text-sky-600 dark:text-sky-300' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold">{style}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800" />

          {/* AI Detail Level Slider */}
          <div className="py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Detail Level</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40">
                {settings.aiDetailLevel}
              </span>
            </div>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={detailLevels.indexOf(settings.aiDetailLevel)}
                onChange={(e) => updateSetting('aiDetailLevel', detailLevels[parseInt(e.target.value)] || 'Detailed')}
                className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-800 accent-sky-600 cursor-pointer focus:outline-none"
              />
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-1">
                <span>Basic</span>
                <span>Balanced</span>
                <span>Detailed</span>
              </div>
            </div>
          </div>
        </SettingsGroup>

        {/* Data & Storage Group */}
        <SettingsGroup title="Data & Storage" subtitle="Manage export, profile backup, and locally saved variables.">
          <div className="divide-y divide-slate-150 dark:divide-slate-800">
            {/* Export Trips Row */}
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Export Trips Data</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Download all your planned trips and itineraries to a local JSON file.</p>
              </div>
              <button
                type="button"
                onClick={handleExportTrips}
                disabled={isExporting}
                className="btn-secondary self-start sm:self-auto flex items-center gap-1.5 shadow-sm hover:scale-[1.01]"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
                ) : (
                  <Download className="h-4 w-4 text-sky-600" />
                )}
                {isExporting ? 'Exporting...' : 'Export Trips'}
              </button>
            </div>

            {/* Profile Summary Row */}
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Download Profile Summary</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Download a full text copy of your personal summary and preferences.</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadProfileSummary}
                disabled={isDownloadingSummary}
                className="btn-secondary self-start sm:self-auto flex items-center gap-1.5 shadow-sm hover:scale-[1.01]"
              >
                {isDownloadingSummary ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
                ) : (
                  <Eye className="h-4 w-4 text-sky-600" />
                )}
                {isDownloadingSummary ? 'Generating...' : 'Download Summary'}
              </button>
            </div>

            {/* Clear Cache Row */}
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Clear Local Cache</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reset layout and local setting states to their original factory defaults.</p>
              </div>
              <button
                type="button"
                onClick={handleClearCache}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-55 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:bg-red-950/15 dark:text-red-400 dark:hover:bg-red-950/30 self-start sm:self-auto shadow-sm"
              >
                <Database className="h-4 w-4" />
                Clear Cache
              </button>
            </div>
          </div>
        </SettingsGroup>

        {/* Security Group */}
        <SettingsGroup title="Security" subtitle="Protect your account authorization and secure current sessions.">
          <div className="divide-y divide-slate-150 dark:divide-slate-800">
            {/* Change Password Row */}
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Change Account Password</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update your security code to keep your group planners safe.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordOpen(true)}
                className="btn-secondary self-start sm:self-auto flex items-center gap-1.5 shadow-sm hover:scale-[1.01]"
              >
                <Lock className="h-4 w-4 text-sky-600" />
                Change Password
              </button>
            </div>

            {/* Logout All Devices Row */}
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Logout From All Other Devices</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Force disconnect other browser locations and tablet connections.</p>
              </div>
              <button
                type="button"
                onClick={handleLogoutAllDevices}
                className="btn-secondary self-start sm:self-auto flex items-center gap-1.5 text-red-650 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-100 dark:border-red-950/20 shadow-sm"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                Logout Other Devices
              </button>
            </div>
          </div>

          {/* Account Protected Badge banner */}
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-500/10 dark:bg-emerald-500/5 flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Account Protection Active</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your credentials and active authentication tokens are fully encrypted on this machine. Two-Factor route guards are active.
              </p>
            </div>
          </div>
        </SettingsGroup>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}

// Subcomponent: Settings Group Wrapper
function SettingsGroup({ title, subtitle, children }) {
  return (
    <section className="travel-surface p-6 hover:shadow-md transition-shadow duration-300">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="h-px bg-slate-100 dark:bg-slate-800 mb-3" />
      {children}
    </section>
  );
}

// Subcomponent: Toggle switch Row
function NotificationToggleRow({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5">{description}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={() => onChange(!checked)} label={title} />
    </div>
  );
}

// Modern Custom Toggle Switch Button
function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
        checked ? 'bg-sky-600' : 'bg-slate-200 dark:bg-slate-700'
      }`}
      type="button"
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
