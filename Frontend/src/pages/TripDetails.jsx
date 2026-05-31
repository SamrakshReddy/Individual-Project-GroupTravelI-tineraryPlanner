import { Calculator, CheckSquare, ChevronDown, Clock, CloudSun, FileDown, IndianRupee, Loader2, MapPin, Plus, ReceiptText, Sparkles, Square, Sun, ThermometerSun, Trash2, TrendingDown, UserPlus, Users, Wallet, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CoverImageUpload from '../components/CoverImageUpload.jsx';
import StatCard from '../components/StatCard.jsx';
import TripMap from '../components/TripMap.jsx';
import defaultCover from '../assets/default-trip-cover.svg';
import { TripCharts } from '../components/TripAnalytics.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { addActivity, addExpense, getTrip, updateTrip } from '../services/tripService';
import { formatCurrency, formatDate, getErrorMessage, getTripActivityCount, getTripTotalExpenses } from '../utils/formatters';

export default function TripDetails() {
  const { tripId } = useParams();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const [isExpensesExpanded, setIsExpensesExpanded] = useState(false);

  async function loadTrip() {
    setIsLoading(true);
    try {
      const response = await getTrip(tripId);
      setTrip(response.data);
    } catch (error) {
      showToast(getErrorMessage(error, 'Could not load trip'), 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  async function handleAddExpense(expense) {
    const totalAfterExpense = getTripTotalExpenses(trip) + Number(expense.amount || 0);
    const budget = Number(trip.budget || 0);

    if (budget > 0 && totalAfterExpense > budget) {
      const remaining = Math.max(0, budget - getTripTotalExpenses(trip));
      showToast(`Expense exceeds trip budget. Remaining budget is ${formatCurrency(remaining)}.`, 'error');
      return;
    }

    try {
      await addExpense(tripId, expense);
      showToast('Expense added', 'success');
      setActiveForm(null);
      setIsExpensesExpanded(true);
      await loadTrip();
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to add expense'), 'error');
    }
  }

  async function handleAddActivity(activity) {
    try {
      await addActivity(tripId, activity);
      showToast('Activity added', 'success');
      setActiveForm(null);
      await loadTrip();
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to add activity'), 'error');
    }
  }

  async function handleAddMember(member) {
    try {
      const members = [...(trip.members || []), member];
      const response = await updateTrip(tripId, { members });
      setTrip(response.data);
      showToast('Member added', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to add member'), 'error');
    }
  }

  async function handleRemoveMember(memberId) {
    try {
      const members = (trip.members || []).filter((member) => member._id !== memberId);
      const response = await updateTrip(tripId, { members });
      setTrip(response.data);
      showToast('Member removed', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to remove member'), 'error');
    }
  }

  async function handleAddPackingItem(itemText) {
    try {
      const packingChecklist = [...(trip.packingChecklist || []), { text: itemText, packed: false }];
      const response = await updateTrip(tripId, { packingChecklist });
      setTrip(response.data);
      showToast('Packing item added', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to add packing item'), 'error');
    }
  }

  async function handleTogglePackingItem(itemId) {
    try {
      const packingChecklist = (trip.packingChecklist || []).map((item) => (
        item._id === itemId ? { ...item, packed: !item.packed } : item
      ));
      const response = await updateTrip(tripId, { packingChecklist });
      setTrip(response.data);
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update packing item'), 'error');
    }
  }

  async function handleRemovePackingItem(itemId) {
    try {
      const packingChecklist = (trip.packingChecklist || []).filter((item) => item._id !== itemId);
      const response = await updateTrip(tripId, { packingChecklist });
      setTrip(response.data);
      showToast('Packing item removed', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to remove packing item'), 'error');
    }
  }

  async function handleUpdateStatus(status) {
    try {
      const response = await updateTrip(tripId, { status });
      setTrip(response.data);
      showToast('Trip status updated', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update trip status'), 'error');
    }
  }

  function handleDownloadPdf() {
    const pdfWindow = window.open('', '_blank', 'width=900,height=700');
    if (!pdfWindow) {
      showToast('Allow popups to download the PDF', 'error');
      return;
    }

    pdfWindow.document.open();
    pdfWindow.document.write(buildTripPdfHtml(trip));
    pdfWindow.document.close();

    pdfWindow.onload = () => {
      pdfWindow.focus();
      pdfWindow.print();
    };

    setTimeout(() => {
      if (!pdfWindow.closed) {
        pdfWindow.focus();
        pdfWindow.print();
      }
    }, 500);
  }

  if (isLoading) {
    return <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />;
  }

  if (!trip) {
    return (
      <div className="card mx-auto max-w-6xl p-6">
        <p>Trip not found.</p>
        <Link className="mt-4 inline-flex text-indigo-600" to="/trips">Back to trips</Link>
      </div>
    );
  }

  const totalExpenses = getTripTotalExpenses(trip);
  const remainingBudget = Math.max(0, Number(trip.budget || 0) - totalExpenses);
  const durationDays = getTripDurationDays(trip);
  const activityCount = getTripActivityCount(trip);
  const expenseCount = (trip.expenses || []).length;
  const memberCount = (trip.members || []).length;
  const budgetUtilized = trip.budget > 0 ? Math.round((totalExpenses / Number(trip.budget)) * 100) : 0;
  const progressWidth = Math.min(budgetUtilized, 100);
  const sortedItinerary = getSortedItinerary(trip);
  const sortedExpenses = [...(trip.expenses || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 overflow-hidden rounded-3xl border border-white/70 shadow-lg dark:border-slate-800">
        <img alt="" className="h-48 w-full object-cover sm:h-56" src={trip.coverImage || defaultCover} />
      </div>

      <div className="travel-hero mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">{trip.destination}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{trip.title}</h1>
            {trip.aiGenerated ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">
                <Sparkles className="h-3.5 w-3.5" />
                Saved from AI Planner
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
          {trip.aiSummary ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{trip.aiSummary}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="btn-primary flex-none" onClick={handleDownloadPdf} type="button">
            <FileDown className="h-5 w-5" />
            Download PDF
          </button>
          <Link className="btn-secondary flex-none" to="/trips">Back to Trips</Link>
        </div>
      </div>

      <section className="mb-8">
        <CoverImageUpload
          coverImage={trip.coverImage}
          onUpdated={(updatedTrip) => setTrip(updatedTrip)}
          tripId={tripId}
        />
      </section>

      <section className="mb-8 grid gap-6 md:grid-cols-3">
        <StatCard icon={IndianRupee} title="Budget" value={formatCurrency(trip.budget)} />
        <StatCard icon={TrendingDown} title="Spent" tone="red" value={formatCurrency(totalExpenses)} />
        <StatCard icon={Wallet} title="Remaining" tone="green" value={formatCurrency(remainingBudget)} />
      </section>

      <section className="mb-8">
        <TripMap destination={trip.destination} title={`Map — ${trip.destination}`} />
      </section>

      <section className="travel-surface mb-6 p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Budget Utilization</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(totalExpenses)} spent from {formatCurrency(trip.budget)}</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
            {budgetUtilized}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${budgetUtilized > 100 ? 'bg-red-500' : 'bg-indigo-600'}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        {budgetUtilized >= 80 && budgetUtilized <= 100 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100">
            <p className="font-bold">🚨 80% Budget Used</p>
            <p className="mt-1 text-sm">Warning: your trip has used {budgetUtilized}% of the budget.</p>
          </div>
        ) : null}
      </section>

      <section className="mb-6">
        <TripCharts isDark={theme === 'dark'} trip={trip} />
      </section>

      <section className="travel-surface mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Plan this trip</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Add activities and track shared costs from one place.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
          <button className="btn-secondary" onClick={() => setActiveForm('activity')} type="button">
            <Plus className="h-5 w-5" />
            Activity
          </button>
          <button className="btn-primary" onClick={() => setActiveForm('expense')} type="button">
            <Plus className="h-5 w-5" />
            Expense
          </button>
        </div>
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-2">
        <div className="travel-surface flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Itinerary</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{activityCount} activities planned</p>
            </div>
          </div>

          {activeForm === 'activity' ? <ActivityForm onCancel={() => setActiveForm(null)} onSubmit={handleAddActivity} /> : null}

          <div className="space-y-3">
            {sortedItinerary.length ? sortedItinerary.map((day) => (
              <div className="rounded-xl bg-sky-50 p-3 dark:bg-slate-800" key={day._id || day.date}>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDate(day.date)}</h3>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {(day.activities || []).map((activity) => (
                    <div className="min-h-20 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900" key={activity._id || `${activity.time}-${activity.activity}`}>
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Clock className="h-4 w-4 text-indigo-500" />
                        {activity.time} - {activity.activity}
                      </p>
                      {activity.notes ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{activity.notes}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            )) : <ItineraryEmptyState />}
          </div>
        </div>

        <div className="travel-surface flex flex-col p-5">
          <button
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setIsExpensesExpanded((current) => !current)}
            type="button"
          >
            <div>
              <h2 className="text-lg font-semibold">Expenses</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{expenseCount} recorded - {formatCurrency(totalExpenses)} spent</p>
            </div>
            <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${isExpensesExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isExpensesExpanded ? (
            <div className="mt-4 flex-1 space-y-3">
              {sortedExpenses.length ? sortedExpenses.map((expense) => (
                <ExpenseCard expense={expense} key={expense._id} />
              )) : <ExpenseEmptyState />}
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white text-indigo-600 dark:bg-slate-900 dark:text-indigo-300">
                <ReceiptText className="h-5 w-5" />
              </div>
              <p>Expenses are collapsed by default. Expand to review cards or add a new expense.</p>
            </div>
          )}
        </div>

        <div className="travel-surface p-5">
          <h2 className="mb-4 text-lg font-semibold">Trip Stats</h2>
          <div className="space-y-3">
            <TripStatRow label="Status" value={trip.status || 'Planning'} />
            <TripStatRow label="Duration" value={`${durationDays} ${durationDays === 1 ? 'Day' : 'Days'}`} />
            <TripStatRow label="Members" value={memberCount} />
            <TripStatRow label="Activities" value={activityCount} />
            <TripStatRow label="Expenses" value={expenseCount} />
            <TripStatRow label="Budget Utilized" value={`${budgetUtilized}%`} />
          </div>
        </div>

        <TripStatusTracker status={trip.status || 'Planning'} onUpdateStatus={handleUpdateStatus} />

        <GroupMembersCard
          members={trip.members || []}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />

        <ExpenseSplitCalculator members={trip.members || []} totalExpenses={totalExpenses} />

        <WeatherWidget destination={trip.destination} />

        <PackingChecklistCard
          items={trip.packingChecklist || []}
          onAddItem={handleAddPackingItem}
          onRemoveItem={handleRemovePackingItem}
          onToggleItem={handleTogglePackingItem}
        />
      </section>

      {activeForm === 'expense' ? <ExpenseModal onCancel={() => setActiveForm(null)} onSubmit={handleAddExpense} /> : null}
    </div>
  );
}

function getTripDurationDays(trip) {
  if (!trip.startDate || !trip.endDate) return 0;

  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const differenceInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(differenceInDays, 1);
}

function getSortedItinerary(trip) {
  return [...(trip.itinerary || [])]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((day) => ({
      ...day,
      activities: [...(day.activities || [])].sort((a, b) => String(a.time || '').localeCompare(String(b.time || ''))),
    }));
}

function buildTripPdfHtml(trip) {
  const totalExpenses = getTripTotalExpenses(trip);
  const remainingBudget = Math.max(0, Number(trip.budget || 0) - totalExpenses);
  const itinerary = getSortedItinerary(trip);
  const expenses = [...(trip.expenses || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const members = trip.members || [];

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(trip.title)} Trip Summary</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            color: #0f172a;
            font-family: Arial, sans-serif;
            background: #ffffff;
          }
          h1, h2, h3, p { margin: 0; }
          .header {
            border-radius: 18px;
            padding: 24px;
            background: linear-gradient(135deg, #e0f2fe, #ffffff, #dcfce7);
            border: 1px solid #e2e8f0;
          }
          .eyebrow {
            color: #0369a1;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          h1 { margin-top: 6px; font-size: 30px; }
          .muted { color: #64748b; font-size: 13px; margin-top: 6px; }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 18px;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 14px;
            margin-top: 18px;
            page-break-inside: avoid;
          }
          .stat-label { color: #64748b; font-size: 12px; }
          .stat-value { margin-top: 5px; font-size: 20px; font-weight: 800; }
          h2 { font-size: 18px; margin-bottom: 12px; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th, td {
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 8px;
            text-align: left;
            vertical-align: top;
          }
          th { color: #475569; background: #f8fafc; }
          ul { margin: 0; padding-left: 18px; }
          li { margin: 6px 0; }
          .empty {
            color: #64748b;
            font-size: 13px;
            padding: 10px 0;
          }
          @media print {
            body { padding: 18px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <section class="header">
          <p class="eyebrow">${escapeHtml(trip.destination)}</p>
          <h1>${escapeHtml(trip.title)}</h1>
          <p class="muted">${formatDate(trip.startDate)} - ${formatDate(trip.endDate)} | Status: ${escapeHtml(trip.status || 'Planning')}</p>
        </section>

        <section class="grid">
          <div class="card">
            <p class="stat-label">Budget</p>
            <p class="stat-value">${formatCurrency(trip.budget)}</p>
          </div>
          <div class="card">
            <p class="stat-label">Expenses</p>
            <p class="stat-value">${formatCurrency(totalExpenses)}</p>
          </div>
          <div class="card">
            <p class="stat-label">Remaining</p>
            <p class="stat-value">${formatCurrency(remainingBudget)}</p>
          </div>
        </section>

        <section class="card">
          <h2>Trip Summary</h2>
          <table>
            <tbody>
              <tr><th>Destination</th><td>${escapeHtml(trip.destination)}</td></tr>
              <tr><th>Duration</th><td>${getTripDurationDays(trip)} days</td></tr>
              <tr><th>Members</th><td>${members.length}</td></tr>
              <tr><th>Activities</th><td>${getTripActivityCount(trip)}</td></tr>
            </tbody>
          </table>
        </section>

        <section class="card">
          <h2>Members</h2>
          ${members.length ? `
            <table>
              <thead><tr><th>Name</th><th>Role</th></tr></thead>
              <tbody>
                ${members.map((member) => `<tr><td>${escapeHtml(member.name)}</td><td>${escapeHtml(member.role || 'Member')}</td></tr>`).join('')}
              </tbody>
            </table>
          ` : '<p class="empty">No members added.</p>'}
        </section>

        <section class="card">
          <h2>Itinerary</h2>
          ${itinerary.length ? itinerary.map((day) => `
            <h3>${formatDate(day.date)}</h3>
            ${(day.activities || []).length ? `
              <ul>
                ${(day.activities || []).map((activity) => `<li><strong>${escapeHtml(activity.time || '')}</strong> ${escapeHtml(activity.activity || '')}${activity.notes ? ` - ${escapeHtml(activity.notes)}` : ''}</li>`).join('')}
              </ul>
            ` : '<p class="empty">No activities for this day.</p>'}
          `).join('') : '<p class="empty">No itinerary activities planned.</p>'}
        </section>

        <section class="card">
          <h2>Expenses</h2>
          ${expenses.length ? `
            <table>
              <thead><tr><th>Description</th><th>Category</th><th>Date</th><th>Amount</th></tr></thead>
              <tbody>
                ${expenses.map((expense) => `
                  <tr>
                    <td>${escapeHtml(expense.description || '')}</td>
                    <td>${escapeHtml(expense.category || 'Other')}</td>
                    <td>${formatDate(expense.date)}</td>
                    <td>${formatCurrency(expense.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="empty">No expenses recorded.</p>'}
        </section>
      </body>
    </html>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function TripStatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm dark:bg-slate-800">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <span className="font-bold text-slate-950 dark:text-white">{value}</span>
    </div>
  );
}

const tripStatuses = ['Planning', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const statusStyles = {
  Planning: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
  Upcoming: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200',
  Ongoing: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200',
};

function TripStatusTracker({ status, onUpdateStatus }) {
  return (
    <div className="travel-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
            <MapPin className="h-5 w-5 text-sky-600 dark:text-sky-300" />
            Trip Status
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track where this trip stands.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${statusStyles[status] || statusStyles.Planning}`}>
          {status}
        </span>
      </div>

      <div className="grid gap-2">
        {tripStatuses.map((item) => {
          const isActive = item === status;

          return (
            <button
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? `${statusStyles[item]} shadow-sm`
                  : 'bg-sky-50 text-slate-600 hover:bg-sky-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
              key={item}
              onClick={() => onUpdateStatus(item)}
              type="button"
            >
              <span>{item}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-current' : 'bg-slate-300 dark:bg-slate-600'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GroupMembersCard({ members, onAddMember, onRemoveMember }) {
  const [form, setForm] = useState({ name: '', role: 'Member' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    setIsSubmitting(true);
    await onAddMember({ name, role: form.role });
    setForm({ name: '', role: 'Member' });
    setIsSubmitting(false);
  }

  return (
    <div className="travel-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
            <Users className="h-5 w-5 text-sky-600 dark:text-sky-300" />
            Group Members
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{members.length} {members.length === 1 ? 'member' : 'members'} added</p>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
          👥 {members.length}
        </span>
      </div>

      <form className="grid gap-3" onSubmit={handleSubmit}>
        <input className="field" name="name" onChange={updateField} placeholder="Member name" required value={form.name} />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <select className="field" name="role" onChange={updateField} value={form.role}>
            <option>Leader</option>
            <option>Member</option>
          </select>
          <button className="btn-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Add
          </button>
        </div>
      </form>

      <div className="mt-4 space-y-2">
        {members.length ? members.map((member) => (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-50 p-3 dark:bg-slate-800" key={member._id || `${member.name}-${member.role}`}>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-950 dark:text-white">{member.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{member.role || 'Member'}</p>
            </div>
            <button
              aria-label={`Remove ${member.name}`}
              className="rounded-xl p-2 text-red-600 transition-colors duration-200 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
              onClick={() => onRemoveMember(member._id)}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-950">
            <div className="text-3xl" aria-hidden="true">👥</div>
            <p className="mt-2 font-semibold text-slate-950 dark:text-white">No members yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add names like Samraksh, Teja, or Pranay.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExpenseSplitCalculator({ members, totalExpenses }) {
  const [splitMode, setSplitMode] = useState('equal');
  const [customSplit, setCustomSplit] = useState({});
  const memberCount = members.length;
  const equalAmount = memberCount ? totalExpenses / memberCount : 0;
  const assignedTotal = members.reduce((total, member) => total + Number(customSplit[getMemberKey(member)] || 0), 0);
  const remainingCustomAmount = totalExpenses - assignedTotal;

  function updateCustomAmount(member, value) {
    setCustomSplit({
      ...customSplit,
      [getMemberKey(member)]: value,
    });
  }

  return (
    <div className="travel-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
            <Calculator className="h-5 w-5 text-sky-600 dark:text-sky-300" />
            Expense Split
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Divide trip expenses across members.</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
          {formatCurrency(totalExpenses)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-sky-50 p-1 dark:bg-slate-800">
        <button
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200 ${splitMode === 'equal' ? 'bg-white text-sky-700 shadow-sm dark:bg-slate-950 dark:text-sky-200' : 'text-slate-600 dark:text-slate-300'}`}
          onClick={() => setSplitMode('equal')}
          type="button"
        >
          Equal split
        </button>
        <button
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200 ${splitMode === 'custom' ? 'bg-white text-sky-700 shadow-sm dark:bg-slate-950 dark:text-sky-200' : 'text-slate-600 dark:text-slate-300'}`}
          onClick={() => setSplitMode('custom')}
          type="button"
        >
          Custom split
        </button>
      </div>

      {!memberCount ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-950">
          <div className="text-3xl" aria-hidden="true">💸</div>
          <p className="mt-2 font-semibold text-slate-950 dark:text-white">Add members to split expenses</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Once members are added, each share is calculated here.</p>
        </div>
      ) : splitMode === 'equal' ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-emerald-50 p-4 text-center text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100">
            <p className="text-sm">Each pays</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(equalAmount)}</p>
            <p className="mt-1 text-xs opacity-80">{formatCurrency(totalExpenses)} split across {memberCount} {memberCount === 1 ? 'member' : 'members'}</p>
          </div>

          {members.map((member) => (
            <SplitRow amount={equalAmount} key={getMemberKey(member)} member={member} />
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {members.map((member) => (
            <div className="grid gap-2 rounded-xl bg-sky-50 p-3 dark:bg-slate-800" key={getMemberKey(member)}>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor={`split-${getMemberKey(member)}`}>
                {member.name}
              </label>
              <input
                className="field"
                id={`split-${getMemberKey(member)}`}
                min="0"
                name={`split-${getMemberKey(member)}`}
                onChange={(event) => updateCustomAmount(member, event.target.value)}
                placeholder="Amount"
                type="number"
                value={customSplit[getMemberKey(member)] || ''}
              />
            </div>
          ))}

          <div className="grid gap-2 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600 dark:text-slate-300">Assigned</span>
              <span className="font-bold text-slate-950 dark:text-white">{formatCurrency(assignedTotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600 dark:text-slate-300">Remaining</span>
              <span className={`font-bold ${remainingCustomAmount === 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
                {formatCurrency(remainingCustomAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SplitRow({ member, amount }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-50 p-3 dark:bg-slate-800">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950 dark:text-white">{member.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{member.role || 'Member'}</p>
      </div>
      <p className="flex-none font-bold text-slate-950 dark:text-white">{formatCurrency(amount)}</p>
    </div>
  );
}

function getMemberKey(member) {
  return member._id || `${member.name}-${member.role}`;
}

function WeatherWidget({ destination }) {
  const weather = getDestinationWeather(destination);

  return (
    <div className="travel-surface overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
            <Sun className="h-5 w-5 text-amber-500" />
            Weather
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Destination forecast preview</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-200">
          <CloudSun className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-gradient-to-br from-amber-50 via-sky-50 to-emerald-50 p-5 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{destination}</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-bold text-slate-950 dark:text-white">{weather.temperature}°C</p>
            <p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-200">{weather.condition}</p>
          </div>
          <ThermometerSun className="h-10 w-10 text-amber-500" />
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{weather.note}</p>
      </div>
    </div>
  );
}

function getDestinationWeather(destination) {
  const normalizedDestination = String(destination || '').toLowerCase();
  const weatherByDestination = [
    { match: 'thailand', temperature: 32, condition: 'Sunny', note: 'Warm and bright. Pack light clothes and sunscreen.' },
    { match: 'goa', temperature: 31, condition: 'Humid', note: 'Beach weather with a warm breeze.' },
    { match: 'tirupati', temperature: 34, condition: 'Clear', note: 'Hot daytime weather. Carry water.' },
    { match: 'paris', temperature: 18, condition: 'Partly cloudy', note: 'Comfortable walking weather.' },
    { match: 'bali', temperature: 29, condition: 'Sunny', note: 'Tropical and warm through the day.' },
    { match: 'tokyo', temperature: 22, condition: 'Cloudy', note: 'Mild weather for city exploring.' },
  ];

  return weatherByDestination.find((weather) => normalizedDestination.includes(weather.match)) || {
    temperature: 27,
    condition: 'Pleasant',
    note: 'Static preview based on common travel conditions.',
  };
}

function PackingChecklistCard({ items, onAddItem, onToggleItem, onRemoveItem }) {
  const [itemText, setItemText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const packedCount = items.filter((item) => item.packed).length;

  async function handleSubmit(event) {
    event.preventDefault();
    const text = itemText.trim();
    if (!text) return;

    setIsSubmitting(true);
    await onAddItem(text);
    setItemText('');
    setIsSubmitting(false);
  }

  return (
    <div className="travel-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
            <span aria-hidden="true">🎒</span>
            Packing Checklist
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{packedCount} of {items.length} packed</p>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
          {items.length}
        </span>
      </div>

      <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
        <input
          className="field"
          onChange={(event) => setItemText(event.target.value)}
          placeholder="Passport, clothes, charger..."
          required
          value={itemText}
        />
        <button className="btn-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {items.length ? items.map((item) => (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-50 p-3 dark:bg-slate-800" key={item._id || item.text}>
            <button
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              onClick={() => onToggleItem(item._id)}
              type="button"
            >
              {item.packed ? (
                <CheckSquare className="h-5 w-5 flex-none text-emerald-600 dark:text-emerald-300" />
              ) : (
                <Square className="h-5 w-5 flex-none text-slate-400 dark:text-slate-500" />
              )}
              <span className={`truncate font-semibold ${item.packed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-950 dark:text-white'}`}>
                {item.text}
              </span>
            </button>
            <button
              aria-label={`Remove ${item.text}`}
              className="rounded-xl p-2 text-red-600 transition-colors duration-200 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
              onClick={() => onRemoveItem(item._id)}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-950">
            <div className="text-3xl" aria-hidden="true">🎒</div>
            <p className="mt-2 font-semibold text-slate-950 dark:text-white">No packing items yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add essentials like Passport, Clothes, Charger, or Shoes.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ItineraryEmptyState() {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-950">
      <div className="text-3xl" aria-hidden="true">🗓️</div>
      <h3 className="mt-2 font-semibold text-slate-950 dark:text-white">No activities yet</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Click + Activity to start planning</p>
    </div>
  );
}

function ExpenseCard({ expense }) {
  return (
    <div className="flex min-h-24 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950 dark:text-white">{expense.description}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{expense.category || 'Other'} - {formatDate(expense.date)}</p>
      </div>
      <p className="flex-none font-bold text-red-600 dark:text-red-300">{formatCurrency(expense.amount)}</p>
    </div>
  );
}

function ExpenseEmptyState() {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200">
        <ReceiptText className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-semibold text-slate-950 dark:text-white">No expenses yet</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Use the Expense button to add your first trip cost.</p>
    </div>
  );
}

function ExpenseModal({ onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Add Expense</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Record a shared cost for this trip.</p>
          </div>
          <button className="btn-secondary px-3" onClick={onCancel} type="button" aria-label="Close expense form">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ExpenseForm onCancel={onCancel} onSubmit={onSubmit} />
      </div>
    </div>
  );
}

function ExpenseForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ description: '', amount: '', category: 'Other' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ ...form, amount: Number(form.amount) });
    setIsSubmitting(false);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div>
        <label className="label" htmlFor="expense-description">Description</label>
        <input className="field" id="expense-description" name="description" onChange={updateField} placeholder="Hotel booking" required value={form.description} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="expense-amount">Amount</label>
          <input className="field" id="expense-amount" min="0" name="amount" onChange={updateField} placeholder="2500" required type="number" value={form.amount} />
        </div>
        <div>
          <label className="label" htmlFor="expense-category">Category</label>
          <input className="field" id="expense-category" name="category" onChange={updateField} placeholder="Category" value={form.category} />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button className="btn-secondary" onClick={onCancel} type="button">Cancel</button>
        <button className="btn-primary" disabled={isSubmitting} type="submit">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</button>
      </div>
    </form>
  );
}

function ActivityForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ date: '', time: '', activity: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    await onSubmit(form);
    setIsSubmitting(false);
  }

  return (
    <form className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 md:grid-cols-2" onSubmit={handleSubmit}>
      <input className="field" name="date" onChange={updateField} required type="date" value={form.date} />
      <input className="field" name="time" onChange={updateField} required type="time" value={form.time} />
      <input className="field md:col-span-2" name="activity" onChange={updateField} placeholder="Activity" required value={form.activity} />
      <textarea className="field md:col-span-2" name="notes" onChange={updateField} placeholder="Notes" rows="3" value={form.notes} />
      <div className="flex gap-2 md:col-span-2">
        <button className="btn-primary" disabled={isSubmitting} type="submit">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</button>
        <button className="btn-secondary" onClick={onCancel} type="button">Cancel</button>
      </div>
    </form>
  );
}
