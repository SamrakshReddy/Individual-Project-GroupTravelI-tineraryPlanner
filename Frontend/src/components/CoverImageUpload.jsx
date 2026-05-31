import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { removeTripCoverImage, uploadTripCoverImage } from '../services/tripService.js';
import { getErrorMessage } from '../utils/formatters.js';

export default function CoverImageUpload({ tripId, coverImage = '', onUpdated }) {
  const { showToast } = useToast();
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file) {
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Only JPG, PNG, and WEBP images are allowed', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadTripCoverImage(tripId, file);
      onUpdated(response.data.trip || response.data);
      showToast('Cover image uploaded', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to upload image'), 'error');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    setIsUploading(true);
    try {
      const response = await removeTripCoverImage(tripId);
      onUpdated(response.data.trip || response.data);
      showToast('Cover image removed', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to remove image'), 'error');
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="travel-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Trip cover image</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Shown on cards and trip details.</p>
        </div>
        {coverImage ? (
          <button className="btn-secondary text-red-600 dark:text-red-300" disabled={isUploading} onClick={handleRemove} type="button">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Remove
          </button>
        ) : null}
      </div>

      {coverImage ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <img alt="Trip cover" className="h-56 w-full object-cover" src={coverImage} />
        </div>
      ) : null}

      <div
        className={`mt-4 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10'
            : 'border-slate-300 bg-slate-50 hover:border-sky-300 hover:bg-sky-50/60 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-sky-500/40'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDrop={handleDrop}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
      >
        <input
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              {coverImage ? <Upload className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
            </div>
            <p className="mt-3 font-semibold text-slate-800 dark:text-white">
              {coverImage ? 'Replace cover image' : 'Upload cover image'}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Drag and drop or click to browse (max 5MB)</p>
          </>
        )}
      </div>
    </div>
  );
}
