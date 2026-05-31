export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function getTripTotalExpenses(trip) {
  return (trip.expenses || []).reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

export function getTripActivityCount(trip) {
  return (trip.itinerary || []).reduce((total, day) => total + (day.activities || []).length, 0);
}

export function getErrorMessage(error, fallbackMessage) {
  const data = error?.response?.data;
  const detail = data?.errors?.[0] || data?.error;
  const base = data?.message || fallbackMessage;
  return detail && !base.includes(detail) ? `${base}. ${detail}` : base;
}
