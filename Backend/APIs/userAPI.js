import exp from 'express';

export const userAPI = exp.Router();

userAPI.get('/examples', async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Postman-ready examples fetched',
    data: {
      endpoints: [
        { method: 'POST', url: '/api/auth/register', body: { username: 'sam', email: 'sam@example.com', password: 'secret123' } },
        { method: 'POST', url: '/api/auth/login', body: { email: 'sam@example.com', password: 'secret123' } },
        { method: 'GET', url: '/api/auth/profile', auth: 'Bearer <accessToken>' },
        { method: 'GET', url: '/api/trips?search=goa&status=upcoming&sort=budget&page=1&limit=10', auth: 'Bearer <accessToken>' },
        { method: 'POST', url: '/api/expenses', auth: 'Bearer <accessToken>', body: { tripId: '<tripId>', description: 'Hotel booking', amount: 12000, category: 'Accommodation' } },
        { method: 'GET', url: '/api/dashboard/analytics', auth: 'Bearer <accessToken>' },
      ],
    },
  });
});

export default userAPI;
