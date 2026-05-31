export const profilePersonalKey = 'travelPlannerProfilePersonal';
export const profileTravelPrefsKey = 'travelPlannerProfileTravelPrefs';
export const profileNotificationsKey = 'travelPlannerProfileNotifications';

export const defaultPersonalInfo = {
  displayName: '',
  phone: '',
  country: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
};

export const defaultTravelPreferences = {
  preferredBudget: 'moderate',
  travelStyle: 'friends',
  favoriteActivities: ['sightseeing'],
};

export const defaultNotificationSettings = {
  tripReminders: true,
  budgetAlerts: true,
  aiPlannerSuggestions: true,
  expenseAlerts: true,
};

export const budgetOptions = [
  { value: 'budget', label: 'Budget' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'luxury', label: 'Luxury' },
];

export const travelStyleOptions = [
  { value: 'solo', label: 'Solo' },
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'business', label: 'Business' },
];

export const activityOptions = [
  { value: 'beaches', label: 'Beaches' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'food-tours', label: 'Food Tours' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'nature', label: 'Nature' },
];

export function getInitials(name) {
  const parts = String(name || 'T').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export function loadPersonalInfo() {
  try {
    const saved = JSON.parse(localStorage.getItem(profilePersonalKey));
    return { ...defaultPersonalInfo, ...(saved || {}) };
  } catch {
    return { ...defaultPersonalInfo };
  }
}

export function savePersonalInfo(data) {
  localStorage.setItem(profilePersonalKey, JSON.stringify(data));
}

export function loadTravelPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(profileTravelPrefsKey));
    return {
      ...defaultTravelPreferences,
      ...(saved || {}),
      favoriteActivities: saved?.favoriteActivities || defaultTravelPreferences.favoriteActivities,
    };
  } catch {
    return { ...defaultTravelPreferences };
  }
}

export function saveTravelPreferences(data) {
  localStorage.setItem(profileTravelPrefsKey, JSON.stringify(data));
}

export function loadNotificationSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(profileNotificationsKey));
    return { ...defaultNotificationSettings, ...(saved || {}) };
  } catch {
    return { ...defaultNotificationSettings };
  }
}

export function saveNotificationSettings(data) {
  localStorage.setItem(profileNotificationsKey, JSON.stringify(data));
}

export function getAccountSummary(trips) {
  const aiPlans = trips.filter((trip) => trip.aiGenerated).length;
  const savedItineraries = trips.filter((trip) => (trip.itinerary || []).some((day) => (day.activities || []).length > 0)).length;

  return {
    tripsCreated: trips.length,
    aiPlansGenerated: aiPlans,
    savedItineraries,
  };
}

export function formatRole(role) {
  if (role === 'admin') return 'Administrator';
  return 'Traveler';
}

export function formatLastLogin(value) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
