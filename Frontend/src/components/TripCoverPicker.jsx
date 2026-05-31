import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { uploadTripCoverPhoto } from '../services/tripService';
import { getErrorMessage } from '../utils/formatters';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxBytes = 5 * 1024 * 1024;

export default function TripCoverPicker({ value, onChange, showToast, onUploadingChange }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState('');

  const previewSrc = value || localPreview;

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  const accept = useMemo(() => allowedTypes.join(','), []);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  function validateFile(file) {
    if (!file) return 'Please choose an image.';
    if (!allowedTypes.includes(file.type)) return 'Only JPG, PNG, and WEBP images are allowed.';
    if (file.size > maxBytes) return 'Image must be smaller than 5MB.';
    return '';
  }

  async function handleFile(file) {
    const error = validateFile(file);
    if (error) {
      showToast?.(error, 'error');
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    setIsUploading(true);
    setProgress(0);
    try {
      const response = await uploadTripCoverPhoto(file, { onProgress: setProgress });
      const imageUrl = response.data?.imageUrl;
      if (!imageUrl) throw new Error('Upload succeeded but no URL returned.');
      onChange(imageUrl);
      setLocalPreview('');
      showToast?.('Cover photo uploaded', 'success');
    } catch (err) {
      showToast?.(getErrorMessage(err, 'Failed to upload cover photo'), 'error');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function handleRemove() {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview('');
    }
    onChange('');
  }

  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <label className="label">Cover photo (optional)</label>
          <p className="text-xs text-slate-500 dark:text-slate-400">Shown on your dashboard, trips list, and trip details.</p>
        </div>
        {previewSrc ? (
          <button className="btn-secondary text-red-600 dark:text-red-300" disabled={isUploading} onClick={handleRemove} type="button">
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        ) : null}
      </div>

      {previewSrc ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <img alt="Cover preview" className="h-44 w-full object-cover sm:h-52" src={previewSrc} />
        </div>
      ) : null}

      <div
        className={`mt-3 flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-all duration-200 ${
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
          accept={accept}
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />

        {isUploading ? (
          <div className="flex w-full max-w-sm flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Uploading… {progress ? `${progress}%` : ''}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-sky-600 transition-all duration-200" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              {previewSrc ? <Upload className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
            </div>
            <p className="mt-3 font-semibold text-slate-800 dark:text-white">{previewSrc ? 'Replace cover photo' : 'Upload cover photo'}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Drag & drop or click to browse (JPG/PNG/WEBP, max 5MB)</p>
          </>
        )}
      </div>
    </div>
  );
}

