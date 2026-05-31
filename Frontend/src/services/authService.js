import api from './api';

export function loginUser(credentials) {
  return api.post('/auth/login', credentials);
}

export function registerUser(userDetails) {
  return api.post('/auth/register', userDetails);
}

export function getProfile() {
  return api.get('/auth/profile');
}

export function logoutAllSessions() {
  return api.post('/auth/logout', {});
}
