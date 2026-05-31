export async function geocodeDestination(query) {
  const destination = String(query || '').trim();
  if (!destination) return null;

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'GroupTravelItineraryPlanner/1.0',
    },
  });

  if (!response.ok) return null;

  const results = await response.json();
  if (!results?.length) return null;

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
    label: results[0].display_name,
  };
}
