import { BarChart3, LogOut, Map, Menu, Moon, Plane, PlusCircle, Settings, Sparkles, Sun, User, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import NotificationBell from './NotificationBell.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/ai-planner', label: 'AI Planner', icon: Sparkles },
  { to: '/trips', label: 'My Trips', icon: Map },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.55),transparent_32%),linear-gradient(135deg,#f0f9ff_0%,#ffffff_48%,#ecfdf5_100%)] transition-colors duration-300 dark:bg-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_100%)]">
      {isMobileSidebarOpen ? (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobileSidebar}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[248px] border-r border-white/70 bg-white/90 shadow-2xl shadow-sky-900/10 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 dark:border-slate-800 dark:bg-slate-950/95 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          <button
            className="flex h-[91px] w-full items-center gap-3 bg-gradient-to-r from-sky-200 via-white to-emerald-100 px-4 text-left text-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:text-white"
            onClick={() => {
              navigate('/dashboard');
              closeMobileSidebar();
            }}
            type="button"
          >
            <div className="rounded-xl bg-sky-600 p-2.5 text-white shadow-lg shadow-sky-500/25">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">Travel Planner</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Plan your adventures</p>
            </div>
          </button>

          <nav className="flex-1 space-y-2 px-4 py-8">
            {navItems.map((item) => (
              <NavLink
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-100 text-sky-800 shadow-sm dark:bg-white/10 dark:text-white'
                      : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700 dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white'
                  }`
                }
                key={item.to}
                to={item.to}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}

            <button
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-sky-50 hover:text-sky-700 dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => {
                navigate('/trips?new=true');
                closeMobileSidebar();
              }}
              type="button"
            >
              <PlusCircle className="h-5 w-5" />
              Create Trip
            </button>
          </nav>

          <div className="border-t border-slate-200 p-4 dark:border-white/10">
            <button
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
              onClick={() => {
                closeMobileSidebar();
                logout();
              }}
              type="button"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-gradient-to-r from-sky-100/95 via-white/95 to-emerald-100/95 px-4 py-0 text-slate-900 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-900/95 dark:text-white lg:px-6">
          <div className="flex h-[70px] items-center justify-between gap-3">
            <button className="flex items-center gap-2 font-bold text-slate-900 dark:text-white lg:hidden" onClick={() => setIsMobileSidebarOpen(true)} type="button">
              {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              {pageTitle}
            </button>

            <h1 className="hidden text-xl font-bold lg:block">{pageTitle}</h1>

            <div className="flex items-center gap-3 sm:gap-4">
              <NotificationBell />
              <button
                className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                onClick={toggleTheme}
                type="button"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <div className="hidden text-right sm:block">
                <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back!</p>
                <p className="font-bold text-slate-900 dark:text-white">Traveler</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-500/25">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 pt-2 text-sm text-slate-500 dark:text-slate-400 lg:px-6">
          <div className="travel-surface p-5">
            <p className="font-semibold text-slate-700 dark:text-slate-200">Group Travel Itinerary Planner</p>
            <p className="mt-1">Plan adventures, budgets, activities, and expenses with your group.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function getPageTitle(pathname) {
  if (pathname.startsWith('/trips/') && pathname !== '/trips') return 'Trip Details';
  if (pathname.startsWith('/ai-planner')) return 'AI Planner';
  if (pathname.startsWith('/trips')) return 'My Trips';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'Dashboard';
}
