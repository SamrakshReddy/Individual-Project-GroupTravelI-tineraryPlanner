import { CalendarDays, IndianRupee, MapPin, Plane } from 'lucide-react';
import { useState } from 'react';
import TripCoverPicker from './TripCoverPicker.jsx';

const initialForm = {
  title: '',
  destination: '',
  startDate: '',
  endDate: '',
  budget: '',
};

export default function TripForm({ onSubmit, onCancel, isSubmitting, showToast }) {
  const [form, setForm] = useState(initialForm);
  const [coverImage, setCoverImage] = useState('');
  const [isCoverUploading, setIsCoverUploading] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      ...form,
      budget: Number(form.budget || 0),
      coverImage,
    });
    setForm(initialForm);
    setCoverImage('');
  }

  return (
    <form className="travel-surface grid gap-4 p-5 md:grid-cols-2" onSubmit={handleSubmit}>
      <div className="md:col-span-2">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 p-4 dark:from-slate-800 dark:to-slate-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-950 dark:text-white">Create Trip</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Add the basics, then build the itinerary with your group.</p>
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="label" htmlFor="title">Trip title</label>
        <input className="field" id="title" name="title" onChange={updateField} placeholder="Summer in Goa" required type="text" value={form.title} />
      </div>

      <div className="md:col-span-2">
        <label className="label flex items-center gap-2" htmlFor="destination"><MapPin className="h-4 w-4 text-sky-600" /> Destination</label>
        <input className="field" id="destination" name="destination" onChange={updateField} placeholder="Goa, India" required type="text" value={form.destination} />
      </div>

      <div>
        <label className="label flex items-center gap-2" htmlFor="startDate"><CalendarDays className="h-4 w-4 text-sky-600" /> Start date</label>
        <input className="field" id="startDate" name="startDate" onChange={updateField} required type="date" value={form.startDate} />
      </div>

      <div>
        <label className="label flex items-center gap-2" htmlFor="endDate"><CalendarDays className="h-4 w-4 text-sky-600" /> End date</label>
        <input className="field" id="endDate" name="endDate" onChange={updateField} required type="date" value={form.endDate} />
      </div>

      <div className="md:col-span-2">
        <label className="label flex items-center gap-2" htmlFor="budget"><IndianRupee className="h-4 w-4 text-sky-600" /> Budget</label>
        <input className="field" id="budget" min="0" name="budget" onChange={updateField} placeholder="50000" type="number" value={form.budget} />
      </div>

      <TripCoverPicker
        onChange={setCoverImage}
        onUploadingChange={setIsCoverUploading}
        showToast={showToast}
        value={coverImage}
      />

      <div className="flex flex-col gap-3 sm:flex-row md:col-span-2">
        <button className="btn-primary" disabled={isSubmitting || isCoverUploading} type="submit">
          {isCoverUploading ? 'Uploading cover...' : (isSubmitting ? 'Creating...' : 'Create Trip')}
        </button>
        <button className="btn-secondary" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </form>
  );
}
