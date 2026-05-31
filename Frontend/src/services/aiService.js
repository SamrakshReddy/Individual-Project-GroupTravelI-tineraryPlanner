import api from './api';

export function generateItinerary(tripDetails) {
  return api.post('/ai/generate-itinerary', tripDetails);
}

export function saveAiTrip(payload) {
  return api.post('/ai/save-trip', payload);
}
