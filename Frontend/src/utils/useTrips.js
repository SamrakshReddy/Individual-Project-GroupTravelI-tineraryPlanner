import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getTrips } from '../services/tripService';
import { getErrorMessage } from './formatters';

export function useTrips() {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadTrips() {
    setIsLoading(true);
    try {
      const response = await getTrips();
      setTrips(response.data);
    } catch (error) {
      if (error?.response?.status === 401) {
        logout();
        return;
      }
      showToast(getErrorMessage(error, 'Could not load trips'), 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, []);

  return { trips, isLoading, loadTrips };
}
