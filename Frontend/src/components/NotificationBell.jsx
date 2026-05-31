import { Bell, Check, Loader2, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  deleteNotification,
  getNotifications,
  markNotificationRead,
} from '../services/notificationService.js';
import { getErrorMessage } from '../utils/formatters.js';
import { formatRelativeTime } from '../utils/relativeTime.js';

const typeStyles = {
  budget_alert: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
  expense_alert: 'border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100',
  activity_reminder: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100',
  trip_reminder: 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100',
  ai_reminder: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100',
  system: 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
  trip_status: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100',
};

export default function NotificationBell() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const panelRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getNotifications();
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.meta?.unreadCount || 0);
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast(getErrorMessage(error, 'Could not load notifications'), 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast, token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, [loadNotifications, token]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  async function handleMarkRead(notificationId) {
    try {
      await markNotificationRead(notificationId);
      await loadNotifications();
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update notification'), 'error');
    }
  }

  async function handleDelete(notificationId) {
    try {
      await deleteNotification(notificationId);
      await loadNotifications();
      showToast('Notification removed', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to delete notification'), 'error');
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center rounded-full border border-sky-100 bg-white/80 p-2.5 text-slate-700 shadow-sm transition-all duration-200 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        onClick={() => {
          setIsOpen((open) => !open);
          if (!isOpen) loadNotifications();
        }}
        type="button"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 w-[min(100vw-2rem,360px)] origin-top-right animate-[fadeIn_0.2s_ease-out] overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h3 className="font-bold text-slate-950 dark:text-white">Notifications</h3>
            <button aria-label="Close notifications" className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsOpen(false)} type="button">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : notifications.length ? (
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const isRead = notification.isRead ?? notification.read;
                  return (
                    <div
                      className={`rounded-xl border p-3 transition-all duration-200 ${typeStyles[notification.type] || typeStyles.system} ${isRead ? 'opacity-75' : ''}`}
                      key={notification._id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{notification.title}</p>
                          <p className="mt-1 text-sm opacity-90">{notification.message}</p>
                          <p className="mt-2 text-xs opacity-70">{formatRelativeTime(notification.createdAt)}</p>
                        </div>
                        <div className="flex flex-none gap-1">
                          {!isRead ? (
                            <button
                              aria-label="Mark as read"
                              className="rounded-full p-1.5 hover:bg-white/60 dark:hover:bg-slate-950/40"
                              onClick={() => handleMarkRead(notification._id)}
                              type="button"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          ) : null}
                          <button
                            aria-label="Delete notification"
                            className="rounded-full p-1.5 hover:bg-white/60 dark:hover:bg-slate-950/40"
                            onClick={() => handleDelete(notification._id)}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-white">No notifications</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Trip and budget alerts will appear here.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
