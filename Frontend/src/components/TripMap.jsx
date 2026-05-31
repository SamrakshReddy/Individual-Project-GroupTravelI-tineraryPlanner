import { Loader2, MapPin } from 'lucide-react';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useTheme } from '../context/ThemeContext.jsx';
import { geocodeDestination } from '../utils/geocode.js';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import 'leaflet/dist/leaflet.css';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const markerColors = {
  destination: '#0284c7',
  hotel: '#0891b2',
  activity: '#7c3aed',
  food: '#d97706',
  transport: '#059669',
};

function createColoredIcon(color) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(15,23,42,0.35);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function MapViewUpdater({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

export default function TripMap({
  destination,
  markers = [],
  itinerary = null,
  heightClass = 'h-72 sm:h-80',
  title = 'Trip map',
}) {
  const { theme } = useTheme();
  const [center, setCenter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const aiMarkers = useMemo(() => {
    if (!itinerary || !center) return [];
    return buildAiPlannerMapMarkers(itinerary, center);
  }, [itinerary, center]);

  const mapMarkers = useMemo(() => {
    const items = markers.length ? [...markers] : [...aiMarkers];
    if (center && !items.some((item) => item.type === 'destination')) {
      items.unshift({
        id: 'destination',
        type: 'destination',
        label: destination,
        description: center.label,
        position: [center.lat, center.lng],
      });
    }
    return items.filter((item) => item.position?.length === 2);
  }, [markers, aiMarkers, center, destination]);

  useEffect(() => {
    let isMounted = true;

    async function loadCenter() {
      setIsLoading(true);
      setError('');
      try {
        const result = await geocodeDestination(destination);
        if (!isMounted) return;

        if (!result) {
          setError('Could not locate destination on the map.');
          setCenter(null);
        } else {
          setCenter(result);
        }
      } catch {
        if (isMounted) setError('Failed to load map location.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (destination?.trim()) {
      loadCenter();
    } else {
      setIsLoading(false);
      setCenter(null);
      setError('Enter a destination to view the map.');
    }

    return () => {
      isMounted = false;
    };
  }, [destination]);

  if (isLoading) {
    return (
      <div className={`travel-surface flex ${heightClass} items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!center || error) {
    return (
      <div className={`travel-surface flex ${heightClass} items-center justify-center p-6 text-center`}>
        <div>
          <MapPin className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{error || 'Map unavailable'}</p>
        </div>
      </div>
    );
  }

  const mapCenter = [center.lat, center.lng];

  return (
    <div className="travel-surface overflow-hidden p-4">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
        <MapPin className="h-5 w-5 text-sky-600" />
        {title}
      </h3>
      <div className={`overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 ${heightClass}`}>
        <MapContainer center={mapCenter} className="h-full w-full" scrollWheelZoom zoom={12}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url={
              theme === 'dark'
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
          />
          <MapViewUpdater center={mapCenter} zoom={12} />
          {mapMarkers.map((item) => (
            <Marker
              icon={item.type === 'destination' ? defaultIcon : createColoredIcon(markerColors[item.type] || markerColors.activity)}
              key={item.id}
              position={item.position}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{item.label}</p>
                  {item.description ? <p className="mt-1">{item.description}</p> : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export function buildAiPlannerMapMarkers(itinerary, center) {
  if (!center) return [];

  const offset = 0.012;
  const markers = [];

  (itinerary?.hotels || []).slice(0, 5).forEach((hotel, index) => {
    markers.push({
      id: `hotel-${index}`,
      type: 'hotel',
      label: hotel.name,
      description: hotel.area || hotel.reason,
      position: [center.lat + offset * (index + 1) * 0.3, center.lng + offset * index],
    });
  });

  (itinerary?.food || []).slice(0, 5).forEach((food, index) => {
    markers.push({
      id: `food-${index}`,
      type: 'food',
      label: food.name,
      description: food.type,
      position: [center.lat - offset * (index + 1) * 0.25, center.lng + offset],
    });
  });

  (itinerary?.transport || []).slice(0, 2).forEach((transport, index) => {
    markers.push({
      id: `transport-${index}`,
      type: 'transport',
      label: transport.mode,
      description: transport.tip,
      position: [center.lat, center.lng - offset * (index + 1)],
    });
  });

  const firstDay = itinerary?.days?.[0];
  (firstDay?.activities || []).slice(0, 3).forEach((activity, index) => {
    markers.push({
      id: `activity-${index}`,
      type: 'activity',
      label: activity.name,
      description: activity.description,
      position: [center.lat + offset * index * 0.2, center.lng - offset * (index + 1) * 0.35],
    });
  });

  return markers;
}
