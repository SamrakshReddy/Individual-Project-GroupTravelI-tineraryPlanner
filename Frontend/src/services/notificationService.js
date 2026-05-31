import api from './api';

export function getNotifications() {
  return api.get('/notifications');
}

export function createNotification(payload) {
  return api.post('/notifications', payload);
}

export function markNotificationRead(notificationId) {
  return api.patch(`/notifications/${notificationId}/read`);
}

export function deleteNotification(notificationId) {
  return api.delete(`/notifications/${notificationId}`);
}
