export function buildMapsNavigationUrl(placeName) {
  const destination = encodeURIComponent(String(placeName || '').trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export function openNavigation(placeName) {
  const query = String(placeName || '').trim();
  if (!query) return false;

  const url = buildMapsNavigationUrl(query);
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function buildPlaceQuery(name, area = '', destination = '') {
  return [name, area, destination].map((part) => String(part || '').trim()).filter(Boolean).join(', ');
}

export function getHotelNavigateQuery(hotel, destination = '') {
  const name = hotel?.name || hotel?.hotelName || hotel?.title || '';
  const area = hotel?.area || hotel?.location || hotel?.city || '';
  return buildPlaceQuery(name, area, destination);
}

export function getFoodNavigateQuery(food, destination = '') {
  const name = food?.name || food?.place || food?.restaurant || food?.title || '';
  const area = food?.type || food?.area || food?.location || '';
  return buildPlaceQuery(name, area, destination);
}
