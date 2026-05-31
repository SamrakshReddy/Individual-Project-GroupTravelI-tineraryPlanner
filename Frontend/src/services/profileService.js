import api from './api';

export function getDashboardAnalytics() {
  return api.get('/dashboard/analytics');
}
