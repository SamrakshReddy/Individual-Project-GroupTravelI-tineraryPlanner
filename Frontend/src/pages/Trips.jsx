import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import TripCard from '../components/TripCard.jsx';
import TripForm from '../components/TripForm.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { createTrip, deleteTrip } from '../services/tripService';
import { getErrorMessage } from '../utils/formatters';
import { useTrips } from '../utils/useTrips';
         
export default function Trips() {
  const { trips, isLoading, loadTrips } = useTrips();
  const { showToast } = useToast();  
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(searchParams.get('new') === 'true');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setShowForm(searchParams.get('new') === 'true');
  }, [searchParams]);

  async function handleCreateTrip(form) {
    setIsSubmitting(true);
    try {
      await createTrip(form);
      showToast('Trip created successfully', 'success');
      setShowForm(false);
      setSearchParams({});
      await loadTrips();
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to create trip'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTrip(tripId) {
    const shouldDelete = window.confirm('Delete this trip? This cannot be undone.');
    if (!shouldDelete) return;

    try {
      await deleteTrip(tripId);
      showToast('Trip deleted successfully', 'success');
      await loadTrips();
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to delete trip'), 'error');
    }
  }

  return (
    <>
      <PageHeader
        title="Trips"
        description="Create trips, review budgets, and jump into detailed planning with your group."
        action={
          <button className="btn-primary" onClick={() => setShowForm(true)} type="button">
            <Plus className="h-5 w-5" />
            New Trip
          </button>
        }
      />

      {showForm ? (
        <div className="mb-6">
          <TripForm isSubmitting={isSubmitting} onCancel={() => setShowForm(false)} onSubmit={handleCreateTrip} showToast={showToast} />
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => <div className="h-80 animate-pulse rounded-2xl bg-sky-100 dark:bg-slate-800" key={item} />)}
        </div>
      ) : trips.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => <TripCard key={trip._id} onDelete={handleDeleteTrip} trip={trip} />)}
        </div>
      ) : (
        <EmptyState
          title="No trips yet"
          description="Create your first group itinerary and start tracking dates, budgets, activities, and expenses."
          action={<button className="btn-primary" onClick={() => setShowForm(true)} type="button">Create Trip</button>}
        />
      )}
    </>
  );
}
