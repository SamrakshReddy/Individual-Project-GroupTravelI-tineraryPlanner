import api from './api';

export function getTrips() {
  return api.get('/trips');
}

export function getTrip(tripId) {
  return api.get(`/trips/${tripId}`);
}

export function createTrip(tripDetails) {
  return api.post('/trips', tripDetails);
}

export function deleteTrip(tripId) {
  return api.delete(`/trips/${tripId}`);
}

export function updateTrip(tripId, tripDetails) {
  return api.put(`/trips/${tripId}`, tripDetails);
}

export function addExpense(tripId, expense) {
  return api.post(`/trips/${tripId}/expenses`, expense);
}

export function addActivity(tripId, activity) {
  return api.post(`/trips/${tripId}/activities`, activity);
}

export function uploadTripCoverImage(tripId, imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  return api.post(`/trips/upload-image/${tripId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function uploadTripCoverPhoto(imageFile, { onProgress } = {}) {
  const formData = new FormData();
  formData.append('coverImage', imageFile);
  return api.post('/trips/upload-cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!onProgress) return;
      const total = event.total || 0;
      const percent = total ? Math.round((event.loaded / total) * 100) : 0;
      onProgress(percent);
    },
  });
}

export function removeTripCoverImage(tripId) {
  return api.delete(`/trips/upload-image/${tripId}`);
}
