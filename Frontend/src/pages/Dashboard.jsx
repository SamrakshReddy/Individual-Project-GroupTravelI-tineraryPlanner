import {
  Activity,
  BedDouble,
  Bell,
  Bus,
  CalendarDays,
  Compass,
  Clock,
  Eye,
  Heart,
  IndianRupee,
  MapPin,
  PieChart,
  Plus,
  Route,
  Send,
  Sparkles,
  Ticket,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { formatCurrency, formatDate, getTripTotalExpenses } from '../utils/formatters';
import { useTrips } from '../utils/useTrips.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const favoriteDestinationsKey = 'travelPlannerFavoriteDestinations';
const defaultFavoriteDestinations = ['Goa', 'Thailand', 'Bali'];

const SMART_RECOMMENDATION_DATA = {
  hotels: [
    { name: 'Traveler Rest Lodge', type: 'Hotel', pricePerNight: 500, note: 'Simple stay that protects a tight budget' },
    { name: 'City Comfort Stay', type: 'Hotel', pricePerNight: 2800, note: 'Clean rooms near transit hubs' },
    { name: 'Local Boutique Inn', type: 'Hotel', pricePerNight: 4200, note: 'Central location with breakfast' },
    { name: 'Premium View Resort', type: 'Hotel', pricePerNight: 7600, note: 'Pool, lounge, and group-friendly rooms' },
    { name: 'Smart Hostel Suites', type: 'Hotel', pricePerNight: 1600, note: 'Best value for tight group budgets' },
  ],
  transport: [
    { name: 'Local Bus Day Pass', type: 'Transport', cost: 250, note: 'Best fit for very small budgets' },
    { name: 'Sleeper Train + Local Metro', type: 'Transport', cost: 4500, note: 'Lowest total cost with flexible timing' },
    { name: 'Shared Cab Package', type: 'Transport', cost: 8500, note: 'Door-to-door comfort for small groups' },
    { name: 'Round-trip Economy Flight', type: 'Transport', cost: 13500, note: 'Fastest option when dates are fixed' },
  ],
  activities: [
    { name: 'Self-guided Landmark Route', type: 'Activity', cost: 100, note: 'Free-form sightseeing with a small buffer' },
    { name: 'Guided Heritage Walk', type: 'Activity', cost: 1800, note: 'A relaxed local introduction' },
    { name: 'Food Trail', type: 'Activity', cost: 2400, note: 'Popular group dining experience' },
    { name: 'Museum and Culture Pass', type: 'Activity', cost: 1200, note: 'Low-cost indoor backup plan' },
    { name: 'Adventure Day Pass', type: 'Activity', cost: 3800, note: 'High-energy full-day plan' },
    { name: 'Sunset Cruise', type: 'Activity', cost: 3200, note: 'Scenic evening activity' },
  ],
};

export default function Dashboard() {
  const { trips, isLoading } = useTrips();
  const { theme } = useTheme();

  const totalExpenses = trips.reduce((total, trip) => total + getTripTotalExpenses(trip), 0);
  const totalBudget = trips.reduce((total, trip) => total + Number(trip.budget || 0), 0);
  const remainingBudget = Math.max(0, totalBudget - totalExpenses);
  const upcomingTrips = trips.filter((trip) => new Date(trip.startDate) >= new Date()).length;
  const destinations = new Set(trips.map((trip) => trip.destination)).size;
  const recentTrips = [...trips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  const upcomingActivities = getUpcomingActivities(trips);
  const averageDuration = getAverageDuration(trips);
  const smartRecommendation = getSmartBudgetRecommendation(trips);
  const notifications = getTravelNotifications(trips);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      <section className="travel-hero overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">Welcome back, Traveler</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Your group trips at a glance</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Track budgets, upcoming plans, activities, and recommendations in one calm travel workspace.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" to="/trips?new=true">
                <Plus className="h-5 w-5" />
                Create Trip
              </Link>
              <Link className="btn-secondary" to="/trips">
                <Send className="h-5 w-5" />
                View Trips
              </Link>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white/75 text-sky-600 shadow-xl shadow-sky-900/10 dark:bg-slate-950/50 dark:text-sky-300">
              <Compass className="h-20 w-20" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard icon={MapPin} iconClass="bg-blue-100 text-blue-600" title="Total Trips" value={trips.length} />
        <DashboardStatCard icon={CalendarDays} iconClass="bg-green-100 text-green-600" title="Upcoming Trips" value={upcomingTrips} />
        <DashboardStatCard icon={IndianRupee} iconClass="bg-red-100 text-red-600" title="Total Expenses" value={formatCurrency(totalExpenses)} />
        <DashboardStatCard icon={IndianRupee} iconClass="bg-emerald-100 text-emerald-600" title="Remaining Budget" value={formatCurrency(remainingBudget)} />
        <DashboardStatCard icon={Route} iconClass="bg-purple-100 text-purple-600" title="Destinations" value={destinations} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel>
          <PanelTitle icon={Zap} iconClass="text-yellow-500" title="Quick Actions" />
          <div className="mt-5 space-y-3">
            <Link
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-500"
              to="/trips?new=true"
            >
              <Plus className="h-5 w-5" />
              Create New Trip
            </Link>
            <Link
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white shadow-lg shadow-green-600/25 transition-all duration-200 hover:bg-green-500"
              to="/trips"
            >
              <Eye className="h-5 w-5" />
              View All Trips
            </Link>
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <PanelTitle icon={TrendingUp} iconClass="text-green-500" title="Travel Insights" />
          <div className="mt-5 space-y-4 text-slate-600 dark:text-slate-300">
            <InsightRow label="Most visited continent" value={destinations ? 'Asia' : '-'} />
            <InsightRow label="Average trip duration" value={averageDuration ? `${averageDuration} days` : '-'} />
            <InsightRow label="Remaining budget" value={formatCurrency(remainingBudget)} />
            <InsightRow label="Total destinations" value={destinations} />
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel>
          <PanelTitle icon={Clock} iconClass="text-blue-500" title="Recent Trips" />
          <div className="mt-5 space-y-3">
            {recentTrips.length ? recentTrips.map((trip) => (
              <Link
                className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4 transition-all duration-200 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800"
                key={trip._id}
                to={`/trips/${trip._id}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {trip.coverImage ? (
                    <img alt="" className="h-10 w-10 flex-none rounded-lg object-cover" src={trip.coverImage} />
                  ) : (
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-bold">{trip.title}</p>
                    <p className="truncate text-sm text-slate-600 dark:text-slate-300">{trip.destination}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-500 dark:text-slate-400">{formatDate(trip.startDate)}</p>
                  <span className="font-semibold text-blue-600">View</span>
                </div>
              </Link>
            )) : <p className="text-sm text-slate-600">No trips yet. Create your first trip!</p>}
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <PanelTitle icon={Bell} iconClass="text-amber-500" title="Notifications" />
          <NotificationList notifications={notifications} />
        </DashboardPanel>
      </section>

      <section>
        <DashboardPanel>
          <PanelTitle icon={Activity} iconClass="text-green-500" title="Upcoming Activities" />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {upcomingActivities.length ? upcomingActivities.map((activity) => (
              <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-950" key={`${activity.tripTitle}-${activity.date}-${activity.time}-${activity.activity}`}>
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">{activity.activity}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{activity.tripTitle} - {activity.destination}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(activity.date)} at {activity.time}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-600 dark:text-slate-300">No upcoming activities. Add some to your trips!</p>}
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel>
          <PanelTitle icon={PieChart} iconClass="text-indigo-500" title="Expense Analytics" />
          <div className="mt-5 h-48 sm:h-56">
            <ExpenseBarChart isDark={theme === 'dark'} trips={trips} />
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <PanelTitle icon={Sparkles} iconClass="text-amber-500" title="Smart Budget Recommendations" />
          <SmartBudgetRecommendations recommendation={smartRecommendation} />
        </DashboardPanel>
      </section>

      <section>
        <DashboardPanel>
          <PanelTitle icon={Heart} iconClass="text-rose-500" title="Favorite Destinations" />
          <FavoriteDestinations />
        </DashboardPanel>
      </section>
    </div>
  );
}

function DashboardStatCard({ icon: Icon, iconClass, title, value }) {
  return (
    <div className="travel-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function DashboardPanel({ children }) {
  return (
    <div className="travel-surface p-5">
      {children}
    </div>
  );
}

function PanelTitle({ icon: Icon, iconClass, title }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
      <Icon className={`h-5 w-5 ${iconClass}`} />
      {title}
    </h2>
  );
}

function InsightRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="font-bold text-slate-800 dark:text-white">{value}</span>
    </div>
  );
}

function NotificationList({ notifications }) {
  return (
    <div className="mt-5 space-y-3">
      {notifications.length ? notifications.map((notification) => (
        <div className={`rounded-xl border p-4 ${notification.className}`} key={notification.id}>
          <div className="flex items-start gap-3">
            <div className="text-2xl" aria-hidden="true">{notification.icon}</div>
            <div>
              <p className="font-bold">{notification.title}</p>
              <p className="mt-1 text-sm opacity-85">{notification.message}</p>
            </div>
          </div>
        </div>
      )) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-950">
          <div className="text-3xl" aria-hidden="true">🔔</div>
          <p className="mt-2 font-semibold text-slate-950 dark:text-white">No notifications</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Trip alerts will appear here.</p>
        </div>
      )}
    </div>
  );
}

function FavoriteDestinations() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem(favoriteDestinationsKey));
      return Array.isArray(savedFavorites) && savedFavorites.length ? savedFavorites : defaultFavoriteDestinations;
    } catch {
      return defaultFavoriteDestinations;
    }
  });
  const [destination, setDestination] = useState('');

  useEffect(() => {
    localStorage.setItem(favoriteDestinationsKey, JSON.stringify(favorites));
  }, [favorites]);

  function handleAddFavorite(event) {
    event.preventDefault();
    const nextDestination = destination.trim();
    if (!nextDestination) return;

    const alreadySaved = favorites.some((favorite) => favorite.toLowerCase() === nextDestination.toLowerCase());
    if (!alreadySaved) {
      setFavorites([...favorites, nextDestination]);
    }
    setDestination('');
  }

  function handleRemoveFavorite(destinationName) {
    setFavorites(favorites.filter((favorite) => favorite !== destinationName));
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="grid gap-3 sm:grid-cols-3">
        {favorites.map((favorite) => (
          <div className="rounded-2xl bg-gradient-to-br from-rose-50 via-white to-sky-50 p-4 shadow-sm dark:from-slate-800 dark:via-slate-900 dark:to-slate-800" key={favorite}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl" aria-hidden="true">❤️</p>
                <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{favorite}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Saved destination</p>
              </div>
              <button
                aria-label={`Remove ${favorite}`}
                className="rounded-full p-2 text-slate-400 transition-colors duration-200 hover:bg-white hover:text-red-500 dark:hover:bg-slate-950"
                onClick={() => handleRemoveFavorite(favorite)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form className="rounded-2xl bg-sky-50 p-4 dark:bg-slate-800" onSubmit={handleAddFavorite}>
        <label className="label" htmlFor="favorite-destination">Save destination</label>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:grid-cols-1">
          <input
            className="field"
            id="favorite-destination"
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Add a place"
            value={destination}
          />
          <button className="btn-primary" type="submit">
            <Heart className="h-4 w-4" />
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function SmartBudgetRecommendations({ recommendation }) {
  if (!recommendation) {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
        Create a trip with a budget to see smart hotel, transport, and activity suggestions.
      </div>
    );
  }

  const {
    trip,
    durationDays,
    availableBudget,
    estimatedTotal,
    remainingAfterPlan,
    budgetProgress,
    hotel,
    transport,
    activities,
  } = recommendation;
  const activityTotal = activities.reduce((total, activity) => total + activity.cost, 0);
  const titleMatchesDestination = String(trip.title || '').trim().toLowerCase() === String(trip.destination || '').trim().toLowerCase();
  const planTitle = titleMatchesDestination ? trip.destination : trip.title;
  const progressTone = budgetProgress > 100 ? 'bg-red-500' : budgetProgress > 80 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Suggested plan</p>
            <h3 className="mt-1 truncate text-xl font-bold text-slate-950 dark:text-white">{planTitle}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {durationDays} {durationDays === 1 ? 'day' : 'days'} in {trip.destination}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-72">
            <BudgetPill label="Plan estimate" value={formatCurrency(estimatedTotal)} />
            <BudgetPill label="Left after plan" value={formatCurrency(Math.max(0, remainingAfterPlan))} tone={remainingAfterPlan < 0 ? 'red' : 'green'} />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Budget progress</span>
            <span className="text-slate-500 dark:text-slate-400">
              {formatCurrency(estimatedTotal)} of {formatCurrency(availableBudget)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressTone}`}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{Math.round(budgetProgress)}% of available budget planned</p>
        </div>
      </div>

      <div className="grid gap-4 2xl:grid-cols-3">
        <RecommendationCard
          icon={BedDouble}
          label="Hotel"
          title={hotel.name}
          amount={formatCurrency(hotel.totalCost)}
          detail={`${formatCurrency(hotel.pricePerNight)} per night`}
          body={hotel.note}
          className="bg-cyan-50 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-100"
        />
        <RecommendationCard
          icon={Bus}
          label="Transport"
          title={transport.name}
          amount={formatCurrency(transport.cost)}
          detail="Best-fit travel option"
          body={transport.note}
          className="bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100"
        />
        <RecommendationCard
          icon={Ticket}
          label="Activities"
          title={`${activities.length} curated picks`}
          amount={formatCurrency(activityTotal)}
          detail="Experiences within budget"
          body="Selected to fit the remaining budget after stay and transport."
          items={activities.map((activity) => activity.name)}
          className="bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-100"
        />
      </div>
    </div>
  );
}

function BudgetPill({ label, value, tone = 'slate' }) {
  const toneClass = tone === 'green'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
    : tone === 'red'
      ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200'
      : 'bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200';

  return (
    <div className={`rounded-lg px-3 py-2 ${toneClass}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function RecommendationCard({ icon: Icon, label, title, amount, detail, body, items = [], className }) {
  return (
    <div className={`rounded-xl border border-slate-200 p-4 dark:border-slate-700 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/75 dark:bg-slate-950/60">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
            <h3 className="mt-0.5 break-words font-bold leading-snug">{title}</h3>
          </div>
        </div>
        <span className="w-fit flex-none rounded-full bg-white/70 px-3 py-1 text-sm font-bold dark:bg-slate-950/60">{amount}</span>
      </div>
      <div className="mt-4 border-t border-current/10 pt-3">
        <p className="text-sm font-semibold opacity-90">{detail}</p>
        {items.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {items.map((item) => (
              <span className="max-w-full rounded-full bg-white/70 px-3 py-1 text-xs font-semibold leading-relaxed dark:bg-slate-950/60" key={item}>{item}</span>
            ))}
          </div>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed opacity-80">{body}</p>
      </div>
    </div>
  );
}

function ExpenseBarChart({ trips, isDark }) {
  const labels = trips.map((trip) => trip.title);
  const data = trips.map(getTripTotalExpenses);

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: 'Expenses',
            data,
            backgroundColor: '#6366f1',
            borderRadius: 0,
            maxBarThickness: 120,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: { color: isDark ? '#475569' : '#64748b' },
            grid: { color: 'rgba(100, 116, 139, 0.22)' },
          },
          y: {
            beginAtZero: true,
            ticks: { color: isDark ? '#475569' : '#64748b' },
            grid: { color: 'rgba(100, 116, 139, 0.22)' },
          },
        },
      }}
    />
  );
}

function getUpcomingActivities(trips) {
  const activities = [];

  trips.forEach((trip) => {
    (trip.itinerary || []).forEach((day) => {
      (day.activities || []).forEach((activity) => {
        activities.push({
          tripTitle: trip.title,
          destination: trip.destination,
          date: day.date,
          time: activity.time,
          activity: activity.activity,
        });
      });
    });
  });

  return activities
    .sort((a, b) => getActivityDateTime(a) - getActivityDateTime(b))
    .slice(0, 3);
}

function getTravelNotifications(trips) {
  const notifications = [];
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  trips.forEach((trip) => {
    const tripStart = startOfDay(new Date(trip.startDate));
    const totalExpenses = getTripTotalExpenses(trip);
    const budget = Number(trip.budget || 0);

    if (tripStart.getTime() === tomorrow.getTime()) {
      notifications.push({
        id: `starts-${trip._id}`,
        icon: '🧳',
        title: 'Trip starts tomorrow',
        message: `${trip.title} to ${trip.destination} starts on ${formatDate(trip.startDate)}.`,
        className: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-100',
      });
    }

    if (budget > 0 && totalExpenses > budget) {
      notifications.push({
        id: `budget-${trip._id}`,
        icon: '💸',
        title: 'Budget exceeded',
        message: `${trip.title} is ${formatCurrency(totalExpenses - budget)} over budget.`,
        className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-100',
      });
    } else if (budget > 0 && totalExpenses >= budget * 0.8) {
      const usedPercent = Math.round((totalExpenses / budget) * 100);
      notifications.push({
        id: `budget-warning-${trip._id}`,
        icon: '🚨',
        title: '80% Budget Used',
        message: `Warning: ${trip.title} has used ${usedPercent}% of its budget.`,
        className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100',
      });
    }

    (trip.itinerary || []).forEach((day) => {
      const activityDate = startOfDay(new Date(day.date));
      const isTodayOrTomorrow = activityDate.getTime() === today.getTime() || activityDate.getTime() === tomorrow.getTime();

      if (isTodayOrTomorrow) {
        (day.activities || []).slice(0, 1).forEach((activity) => {
          notifications.push({
            id: `activity-${trip._id}-${day.date}-${activity.time}-${activity.activity}`,
            icon: '⏰',
            title: 'Activity reminder',
            message: `${activity.activity} is planned for ${formatDate(day.date)}${activity.time ? ` at ${activity.time}` : ''}.`,
            className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100',
          });
        });
      }
    });
  });

  return notifications.slice(0, 5);
}

function startOfDay(date) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
}

function getActivityDateTime(activity) {
  const date = new Date(activity.date);
  const [hours = 0, minutes = 0] = String(activity.time || '00:00').split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getAverageDuration(trips) {
  if (!trips.length) return 0;

  const totalDays = trips.reduce((total, trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    return total + days;
  }, 0);

  return Math.round(totalDays / trips.length);
}

function getSmartBudgetRecommendation(trips) {
  const trip = [...trips]
    .filter((item) => Number(item.budget || 0) > 0)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

  if (!trip) return null;

  const durationDays = getTripDurationDays(trip);
  const totalExpenses = getTripTotalExpenses(trip);
  const availableBudget = Math.max(0, Number(trip.budget || 0) - totalExpenses);
  const hotel = pickHotel(availableBudget, durationDays);
  const transport = pickTransport(availableBudget - hotel.totalCost);
  const activities = pickActivities(availableBudget - hotel.totalCost - transport.cost);
  const estimatedTotal = hotel.totalCost + transport.cost + activities.reduce((total, activity) => total + activity.cost, 0);
  const remainingAfterPlan = availableBudget - estimatedTotal;
  const budgetProgress = availableBudget > 0 ? (estimatedTotal / availableBudget) * 100 : 0;

  return {
    trip,
    durationDays,
    availableBudget,
    estimatedTotal,
    remainingAfterPlan,
    budgetProgress,
    hotel,
    transport,
    activities,
  };
}

function getTripDurationDays(trip) {
  if (!trip.startDate || !trip.endDate) return 1;

  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const differenceInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(differenceInDays, 1);
}

function pickHotel(availableBudget, durationDays) {
  const affordableHotels = SMART_RECOMMENDATION_DATA.hotels
    .map((hotel) => ({ ...hotel, totalCost: hotel.pricePerNight * durationDays }))
    .filter((hotel) => hotel.totalCost <= availableBudget * 0.55)
    .sort((a, b) => b.pricePerNight - a.pricePerNight);

  return affordableHotels[0] || {
    ...SMART_RECOMMENDATION_DATA.hotels[SMART_RECOMMENDATION_DATA.hotels.length - 1],
    totalCost: SMART_RECOMMENDATION_DATA.hotels[SMART_RECOMMENDATION_DATA.hotels.length - 1].pricePerNight * durationDays,
  };
}

function pickTransport(remainingBudget) {
  const affordableTransport = SMART_RECOMMENDATION_DATA.transport
    .filter((transport) => transport.cost <= remainingBudget * 0.45)
    .sort((a, b) => b.cost - a.cost);

  return affordableTransport[0] || SMART_RECOMMENDATION_DATA.transport[0];
}

function pickActivities(remainingBudget) {
  const selectedActivities = [];
  let spendableBudget = Math.max(0, remainingBudget);

  SMART_RECOMMENDATION_DATA.activities
    .sort((a, b) => a.cost - b.cost)
    .forEach((activity) => {
      if (selectedActivities.length < 3 && activity.cost <= spendableBudget) {
        selectedActivities.push(activity);
        spendableBudget -= activity.cost;
      }
    });

  return selectedActivities.length ? selectedActivities : [SMART_RECOMMENDATION_DATA.activities[2]];
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => <div className="h-28 animate-pulse rounded-xl bg-slate-200/80" key={item} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-52 animate-pulse rounded-xl bg-slate-200/80" />
        <div className="h-52 animate-pulse rounded-xl bg-slate-200/80" />
      </div>
    </div>
  );
}
