import {
  BedDouble,
  Bus,
  CalendarDays,
  Clock,
  IndianRupee,
  Lightbulb,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  Ticket,
  UtensilsCrossed,
  Users,
  Wand2,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import NavigateButton from '../components/NavigateButton.jsx';
import PageHeader from '../components/PageHeader.jsx';
import TripMap from '../components/TripMap.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { createNotification } from '../services/notificationService.js';
import { generateItinerary, saveAiTrip } from '../services/aiService.js';
import { formatCurrency, getErrorMessage } from '../utils/formatters.js';
import { getFoodNavigateQuery, getHotelNavigateQuery } from '../utils/navigation.js';

const INTEREST_OPTIONS = [
  'Sightseeing',
  'Adventure',
  'Food & Dining',
  'Nightlife',
  'Nature',
  'Culture & History',
  'Shopping',
  'Beaches',
  'Photography',
  'Wellness',
];

const initialForm = {
  destination: '',
  budget: '',
  travelers: '2',
  days: '3',
  interests: [],
};

export default function AITripPlanner() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleInterest(interest) {
    setForm((current) => {
      const hasInterest = current.interests.includes(interest);
      return {
        ...current,
        interests: hasInterest
          ? current.interests.filter((item) => item !== interest)
          : [...current.interests, interest],
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const destination = form.destination.trim();
    const budget = Number(form.budget);
    const travelers = Number(form.travelers);
    const days = Number(form.days);

    if (!destination || budget <= 0 || travelers <= 0 || days <= 0) {
      const message = 'Please enter a destination, budget, travelers, and trip length.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    setIsLoading(true);
    setItinerary(null);

    try {
      const { data } = await generateItinerary({
        destination,
        budget,
        travelers,
        days,
        interests: form.interests,
      });

      if (!data?.success || !data?.payload) {
        throw new Error(data?.message || 'Could not generate itinerary');
      }

      setItinerary(data.payload);
      showToast('Your AI itinerary is ready!', 'success');
      try {
        await createNotification({
          title: 'AI itinerary ready',
          message: `Your AI plan for ${destination} is ready to review.`,
          type: 'ai_reminder',
        });
      } catch {
        // Notification is optional and should not block itinerary display.
      }
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Failed to generate itinerary. Please try again.');
      const detail = requestError?.response?.data?.errors?.[0] || requestError?.response?.data?.error;
      const fullMessage = detail ? `${message} ${detail}` : message;
      setError(fullMessage);
      showToast(fullMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setForm(initialForm);
    setItinerary(null);
    setError('');
  }

  async function handleSaveTrip() {
    if (!itinerary) return;

    const destination = form.destination.trim();
    const budget = Number(form.budget);
    const travelers = Number(form.travelers);
    const days = Number(form.days);

    setIsSaving(true);
    try {
      const { data } = await saveAiTrip({
        destination,
        budget,
        days,
        travelers,
        interests: form.interests,
        aiPlan: itinerary,
      });

      if (!data?.success || !data?.tripId) {
        throw new Error(data?.message || 'Could not save AI trip');
      }

      showToast('AI Trip saved successfully', 'success');
      navigate(`/trips/${data.tripId}`);
    } catch (requestError) {
      const detail = requestError?.response?.data?.error || requestError?.response?.data?.errors?.[0];
      const message = detail
        ? `${getErrorMessage(requestError, 'Failed to save AI trip')}: ${detail}`
        : getErrorMessage(requestError, 'Failed to save AI trip');
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      <PageHeader
        description="Describe your dream trip and get a practical day-by-day plan with hotels, food, transport, and budget tips powered by Groq AI."
        title="AI Trip Planner"
        action={
          itinerary ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-sky-500 hover:to-emerald-400 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                disabled={isSaving}
                onClick={handleSaveTrip}
                type="button"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save Trip
              </button>
              <button className="btn-secondary" disabled={isSaving} onClick={handleReset} type="button">
                Plan another trip
              </button>
            </div>
          ) : null
        }
      />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr] xl:items-start">
        <PlannerForm
          error={error}
          form={form}
          isLoading={isLoading}
          onInterestToggle={toggleInterest}
          onSubmit={handleSubmit}
          updateField={updateField}
        />

        <ResultsPanel
          destination={form.destination.trim()}
          isLoading={isLoading}
          isSaving={isSaving}
          itinerary={itinerary}
          onSaveTrip={handleSaveTrip}
        />
      </div>
    </div>
  );
}

function PlannerForm({ form, updateField, onInterestToggle, onSubmit, isLoading, error }) {
  return (
    <form className="travel-surface sticky top-[86px] space-y-5 p-5" onSubmit={onSubmit}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          <Wand2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Trip details</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">All fields are required</p>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="ai-destination">
          <MapPin className="mr-1 inline h-4 w-4" />
          Destination
        </label>
        <input
          className="field"
          disabled={isLoading}
          id="ai-destination"
          onChange={(event) => updateField('destination', event.target.value)}
          placeholder="e.g. Goa, Manali, Bangkok"
          value={form.destination}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div>
          <label className="label" htmlFor="ai-budget">
            <IndianRupee className="mr-1 inline h-4 w-4" />
            Total budget (INR)
          </label>
          <input
            className="field"
            disabled={isLoading}
            id="ai-budget"
            min="1"
            onChange={(event) => updateField('budget', event.target.value)}
            placeholder="25000"
            type="number"
            value={form.budget}
          />
        </div>

        <div>
          <label className="label" htmlFor="ai-travelers">
            <Users className="mr-1 inline h-4 w-4" />
            Travelers
          </label>
          <input
            className="field"
            disabled={isLoading}
            id="ai-travelers"
            min="1"
            onChange={(event) => updateField('travelers', event.target.value)}
            type="number"
            value={form.travelers}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="ai-days">
          <CalendarDays className="mr-1 inline h-4 w-4" />
          Number of days
        </label>
        <input
          className="field"
          disabled={isLoading}
          id="ai-days"
          min="1"
          onChange={(event) => updateField('days', event.target.value)}
          type="number"
          value={form.days}
        />
      </div>

      <fieldset>
        <legend className="label">Interests (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const isSelected = form.interests.includes(interest);
            return (
              <button
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm shadow-sky-500/25'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-200 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10'
                }`}
                disabled={isLoading}
                key={interest}
                onClick={() => onInterestToggle(interest)}
                type="button"
              >
                {interest}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <button className="btn-primary w-full" disabled={isLoading} type="submit">
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating itinerary...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate itinerary
          </>
        )}
      </button>
    </form>
  );
}

function ResultsPanel({ itinerary, isLoading, destination, onSaveTrip, isSaving }) {
  if (isLoading) {
    return <LoadingPanel />;
  }

  if (!itinerary) {
    return (
      <EmptyState
        description="Fill in your destination, budget, travelers, and trip length, then generate a personalized itinerary powered by Groq AI."
        title="No itinerary yet"
        action={
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Your plan will appear here with timeline, budget, and recommendations.
          </div>
        }
      />
    );
  }

  return (
    <ItineraryResults
      destination={destination}
      isSaving={isSaving}
      itinerary={itinerary}
      onSaveTrip={onSaveTrip}
    />
  );
}

function LoadingPanel() {
  return (
    <div className="travel-surface flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      <h2 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">Crafting your trip plan</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Groq AI is building a day-by-day itinerary with hotels, food, transport, and budget tips. This may take a few seconds.
      </p>
      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((dot) => (
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-sky-500"
            key={dot}
            style={{ animationDelay: `${dot * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function ItineraryResults({ itinerary, destination, onSaveTrip, isSaving }) {
  const budget = itinerary.estimatedBudget || {};
  const budgetTotal = Object.values(budget).reduce((sum, value) => sum + Number(value || 0), 0);

  const budgetCards = [
    { key: 'hotel', label: 'Hotels', icon: BedDouble, tone: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-100' },
    { key: 'food', label: 'Food', icon: UtensilsCrossed, tone: 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-100' },
    { key: 'transport', label: 'Transport', icon: Bus, tone: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100' },
    { key: 'activities', label: 'Activities', icon: Ticket, tone: 'bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-100' },
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="travel-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Ready to keep this plan?</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Save it as a real trip with activities and estimated expenses.</p>
        </div>
        <button
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-sky-500 hover:to-emerald-400 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          disabled={isSaving}
          onClick={onSaveTrip}
          type="button"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Trip
        </button>
      </div>

      {itinerary.summary ? (
        <section className="travel-hero p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-sky-600 text-white shadow-lg shadow-sky-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">Trip summary</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{itinerary.summary}</p>
            </div>
          </div>
        </section>
      ) : null}

      {destination ? (
        <TripMap destination={destination} itinerary={itinerary} title="Destination map" />
      ) : null}

      <section className="travel-surface p-5">
        <SectionTitle icon={IndianRupee} title="Budget breakdown" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {budgetCards.map(({ key, label, icon: Icon, tone }) => (
            <div className={`rounded-xl border border-slate-200 p-4 dark:border-slate-700 ${tone}`} key={key}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
                <Icon className="h-4 w-4 opacity-80" />
              </div>
              <p className="mt-2 text-xl font-bold">{formatCurrency(budget[key])}</p>
            </div>
          ))}
        </div>
        {budgetTotal > 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Estimated total: <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(budgetTotal)}</span>
          </p>
        ) : null}
      </section>

      {(itinerary.days || []).length > 0 ? (
        <section className="travel-surface p-5">
          <SectionTitle icon={CalendarDays} title="Day-by-day timeline" />
          <div className="mt-5 space-y-6">
            {itinerary.days.map((day, index) => (
              <div
                className="relative pl-8 transition-all duration-300 hover:translate-x-0.5"
                key={`day-${day.day ?? index}`}
              >
                <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                  {day.day ?? index + 1}
                </span>
                {index < itinerary.days.length - 1 ? (
                  <span className="absolute left-[11px] top-8 h-[calc(100%+8px)] w-0.5 bg-sky-200 dark:bg-sky-500/30" />
                ) : null}
                <h3 className="font-bold text-slate-950 dark:text-white">
                  Day {day.day ?? index + 1}
                  {day.title ? `: ${day.title}` : ''}
                </h3>
                <div className="mt-3 space-y-3">
                  {(day.activities || []).length ? (
                    day.activities.map((activity, activityIndex) => (
                      <ActivityCard activity={activity} key={`${day.day}-${activityIndex}-${activity.name}`} />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No activities listed for this day.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <RecommendationSection
          destination={destination}
          emptyMessage="No hotel suggestions returned."
          icon={BedDouble}
          items={itinerary.hotels}
          recommendationType="hotel"
          title="Hotel recommendations"
          renderItem={(hotel) => (
            <>
              <h3 className="flex items-start gap-2 font-bold text-slate-950 dark:text-white">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-sky-600 dark:text-sky-400" />
                <span>{hotel.name}</span>
              </h3>
              {hotel.area ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hotel.area}</p> : null}
              {hotel.estimatedCost ? (
                <p className="mt-2 text-sm font-semibold text-sky-700 dark:text-sky-300">{hotel.estimatedCost}</p>
              ) : null}
              {hotel.reason ? <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{hotel.reason}</p> : null}
            </>
          )}
        />
        <RecommendationSection
          destination={destination}
          emptyMessage="No food recommendations returned."
          icon={UtensilsCrossed}
          items={itinerary.food}
          recommendationType="food"
          title="Food recommendations"
          renderItem={(item) => (
            <>
              <h3 className="flex items-start gap-2 font-bold text-slate-950 dark:text-white">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-400" />
                <span>{item.name}</span>
              </h3>
              {item.type ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.type}</p> : null}
              {item.estimatedCost ? (
                <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-amber-300">{item.estimatedCost}</p>
              ) : null}
              {item.tip ? <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.tip}</p> : null}
            </>
          )}
        />
        <RecommendationSection
          emptyMessage="No transport suggestions returned."
          icon={Bus}
          items={itinerary.transport}
          title="Transport suggestions"
          renderItem={(item) => (
            <>
              <h3 className="font-bold text-slate-950 dark:text-white">{item.mode}</h3>
              {item.estimatedCost ? (
                <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{item.estimatedCost}</p>
              ) : null}
              {item.tip ? <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.tip}</p> : null}
            </>
          )}
        />
      </section>

      {(itinerary.tips || []).length > 0 ? (
        <section className="travel-surface p-5">
          <SectionTitle icon={Lightbulb} title="Travel tips" />
          <ul className="mt-4 space-y-3">
            {itinerary.tips.map((tip, index) => (
              <li
                className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition-all duration-200 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
                key={`tip-${index}`}
              >
                <Lightbulb className="mt-0.5 h-4 w-4 flex-none" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
      <Icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
      {title}
    </h2>
  );
}

function ActivityCard({ activity }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:border-sky-200 hover:bg-sky-50/50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/5">
      <div className="flex flex-wrap items-center gap-2">
        {activity.time ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5" />
            {activity.time}
          </span>
        ) : null}
        {activity.estimatedCost ? (
          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-200">
            {activity.estimatedCost}
          </span>
        ) : null}
      </div>
      <h4 className="mt-2 font-semibold text-slate-950 dark:text-white">{activity.name}</h4>
      {activity.description ? (
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{activity.description}</p>
      ) : null}
    </div>
  );
}

function RecommendationSection({
  title,
  icon: Icon,
  items,
  renderItem,
  emptyMessage,
  destination = '',
  recommendationType = '',
}) {
  function getNavigatePlaceName(item) {
    if (recommendationType === 'hotel') {
      return getHotelNavigateQuery(item, destination);
    }
    if (recommendationType === 'food') {
      return getFoodNavigateQuery(item, destination);
    }
    return '';
  }

  return (
    <div className="travel-surface p-5">
      <SectionTitle icon={Icon} title={title} />
      <div className="mt-4 space-y-3">
        {items?.length ? (
          items.map((item, index) => {
            const navigatePlaceName = getNavigatePlaceName(item);

            return (
              <div
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:hover:border-sky-500/40"
                key={`${title}-${index}`}
              >
                {renderItem(item)}
                {navigatePlaceName ? (
                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                    <NavigateButton className="w-full" placeName={navigatePlaceName} />
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
