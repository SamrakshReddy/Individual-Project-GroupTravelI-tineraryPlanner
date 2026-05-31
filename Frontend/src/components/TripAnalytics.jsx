import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { getTripTotalExpenses } from '../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Filler, Tooltip, Legend);

const palette = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];

function chartOptions(isDark) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: isDark ? '#cbd5e1' : '#334155' },
      },
    },
    scales: {
      x: {
        ticks: { color: isDark ? '#cbd5e1' : '#334155' },
        grid: { color: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: isDark ? '#cbd5e1' : '#334155' },
        grid: { color: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)' },
      },
    },
  };
}

function categoryData(trips) {
  const totals = {};
  trips.forEach((trip) => {
    (trip.expenses || []).forEach((expense) => {
      const category = expense.category || 'Other';
      totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
    });
  });

  return {
    labels: Object.keys(totals),
    datasets: [
      {
        data: Object.values(totals),
        backgroundColor: palette,
        borderWidth: 0,
      },
    ],
  };
}

export function DashboardCharts({ trips, isDark }) {
  const barData = {
    labels: trips.map((trip) => trip.title),
    datasets: [
      {
        label: 'Expenses',
        data: trips.map(getTripTotalExpenses),
        backgroundColor: '#4f46e5',
        borderRadius: 10,
      },
    ],
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="travel-surface p-5">
        <h2 className="mb-4 font-semibold">Expenses by Trip</h2>
        <div className="h-72">
          <Bar data={barData} options={chartOptions(isDark)} />
        </div>
      </div>
      <div className="travel-surface p-5">
        <h2 className="mb-4 font-semibold">Expenses by Category</h2>
        <div className="h-72">
          <Doughnut data={categoryData(trips)} options={{ plugins: { legend: { position: 'bottom', labels: { color: isDark ? '#cbd5e1' : '#334155' } } }, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}

export function TripCharts({ trip, isDark }) {
  const hasExpenses = (trip.expenses || []).some((expense) => Number(expense.amount || 0) > 0);

  if (!hasExpenses) {
    return (
      <div className="travel-surface flex min-h-56 flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl" aria-hidden="true">📊</div>
        <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">No expense data yet</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add an expense to generate analytics</p>
      </div>
    );
  }

  const totalsByDate = {};
  (trip.expenses || []).forEach((expense) => {
    const date = new Date(expense.date).toLocaleDateString();
    totalsByDate[date] = (totalsByDate[date] || 0) + Number(expense.amount || 0);
  });

  const lineData = {
    labels: Object.keys(totalsByDate),
    datasets: [
      {
        label: 'Daily Expenses',
        data: Object.values(totalsByDate),
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.12)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const categoryBreakdown = categoryData([trip]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="travel-surface p-5">
        <h2 className="mb-4 font-semibold">Daily Expenses</h2>
        <div className="h-72">
          <Line data={lineData} options={chartOptions(isDark)} />
        </div>
      </div>
      <div className="travel-surface p-5">
        <h2 className="mb-4 font-semibold">Category Breakdown</h2>
        <div className="h-72">
          <Doughnut data={categoryBreakdown} options={{ plugins: { legend: { position: 'bottom', labels: { color: isDark ? '#cbd5e1' : '#334155' } } }, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}
