import { Calendar, MapPin, Plane, Sparkles, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import defaultCover from '../assets/default-trip-cover.svg';
import { formatCurrency, formatDate, getTripActivityCount, getTripTotalExpenses } from '../utils/formatters';

export default function TripCard({ trip, onDelete }) {
  const totalExpenses = getTripTotalExpenses(trip);
  const remainingBudget = Math.max(0, Number(trip.budget || 0) - totalExpenses);
  const status = trip.status || (new Date(trip.startDate) >= new Date() ? 'Upcoming' : 'Completed');
  const statusClass = {
    Planning: 'text-sky-700 dark:text-sky-200',
    Upcoming: 'text-indigo-700 dark:text-indigo-200',
    Ongoing: 'text-amber-700 dark:text-amber-200',
    Completed: 'text-emerald-700 dark:text-emerald-200',
    Cancelled: 'text-red-700 dark:text-red-200',
  }[status] || 'text-sky-700 dark:text-sky-200';

  return (
    <article className="card flex h-full flex-col overflow-hidden">
      <div className="relative h-36 overflow-hidden">
        <img alt="" className="h-full w-full object-cover" src={trip.coverImage || defaultCover} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
      </div>
      <div className="bg-gradient-to-br from-sky-100 via-white to-emerald-100 p-5 text-slate-950 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 dark:text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{trip.title}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="h-4 w-4" />
              {trip.destination}
            </p>
          </div>
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-500/25">
            <Plane className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-semibold shadow-sm dark:bg-slate-950/60 ${statusClass}`}>
            {status}
          </span>
          {trip.aiGenerated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              Saved from AI Planner
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-5 p-5">
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Calendar className="h-4 w-4" />
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
        </p>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-sky-50 p-3 dark:bg-slate-800">
            <p className="text-xs text-slate-500">Budget</p>
            <p className="mt-1 text-sm font-bold">{formatCurrency(trip.budget)}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-500/15 dark:text-red-200">
            <p className="text-xs">Spent</p>
            <p className="mt-1 text-sm font-bold">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
            <p className="text-xs">Left</p>
            <p className="mt-1 text-sm font-bold">{formatCurrency(remainingBudget)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>{getTripActivityCount(trip)} activities</span>
          <span>{(trip.expenses || []).length} expenses</span>
        </div>

        <div className="mt-auto flex gap-3">
          <Link className="btn-primary flex-1" to={`/trips/${trip._id}`}>
            View Details
          </Link>
          <button className="btn-secondary px-3 text-red-600 dark:text-red-300" onClick={() => onDelete(trip._id)} type="button">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
