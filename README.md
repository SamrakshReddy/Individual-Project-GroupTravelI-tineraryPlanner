# Group Travel Itinerary Planner

A modern, full-stack web application for planning group travel itineraries with expense tracking and beautiful UI.

##   Features

-   **Secure Authentication**: JWT-based login and registration system
-   **Trip Management**: Create, view, edit, and delete travel trips
-   **Day-wise Itinerary**: Plan activities with timings and notes
-   **Expense Tracking**: Monitor expenses with budget management
-   **Modern UI**: Beautiful responsive design with Tailwind CSS and glassmorphism
-   **Mobile Responsive**: Optimized for all device sizes
-   **Travel-themed**: Professional design inspired by travel and adventure

##   Tech Stack

- **Frontend:** HTML, Tailwind CSS, Vanilla JavaScript, Lucide Icons
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcrypt password hashing, CORS
- **UI/UX:** Glassmorphism, gradient backgrounds, hover animations

##   Project Structure

```
/
├── Frontend/
│   ├── index.html
│   ├── js/
│   │   ├── app.js
│   │   ├── auth.js
│   │   └── dashboard.js
│   └── pages/
│       ├── login.html
│       ├── register.html
│       └── dashboard.html
└── backend/
    ├── controllers/
    │   ├── authController.js
    │   └── tripsController.js
    ├── middleware/
    │   └── auth.js
    ├── models/
    │   ├── User.js
    │   └── Trip.js
    ├── routes/
    │   ├── auth.js
    │   └── trips.js
    ├── .env
    ├── package.json
    └── server.js
```

##   Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Modern web browser

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Update `.env` file with your MongoDB URI and JWT secret

4. Start MongoDB service (if using local MongoDB)

5. Start the server:
   ```bash
   npm start
   ```
   or for development:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Open `Frontend/index.html` in a modern web browser

2. The app will automatically redirect to login if not authenticated

##   Usage Guide

### Getting Started
1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Dashboard**: View your travel statistics and quick actions

### Managing Trips
1. **Create Trip**: Click "Create New Trip" and fill in details
2. **View Trips**: Browse all your trips with beautiful cards
3. **Trip Details**: Click "View" to see full itinerary and expenses

### Planning Itinerary
1. **Add Activities**: Plan day-by-day activities with times
2. **Add Notes**: Include important details for each activity
3. **Track Progress**: See your trip planning progress

### Expense Management
1. **Add Expenses**: Record costs as you travel
2. **Monitor Budget**: Track spending against your budget
3. **View Summary**: See total expenses and remaining budget

##   UI Features

- **Glassmorphism Design**: Modern frosted glass effects
- **Gradient Backgrounds**: Beautiful color transitions
- **Hover Animations**: Smooth interactive elements
- **Responsive Cards**: Adaptive layouts for all screens
- **Travel Icons**: Lucide icons for intuitive navigation
- **Progress Bars**: Visual budget tracking
- **Modern Typography**: Clean, readable fonts

##   API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Trips Management
- `GET /api/trips` - Get all user trips
- `GET /api/trips/:id` - Get specific trip details
- `POST /api/trips` - Create new trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip
- `POST /api/trips/:id/expenses` - Add expense to trip
- `POST /api/trips/:id/activities` - Add activity to trip

##   Mobile Features

- Responsive sidebar that collapses on mobile
- Touch-friendly buttons and forms
- Optimized card layouts for small screens
- Mobile-first design approach

##   Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected API routes
- CORS enabled for cross-origin requests

##   Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

##   License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy Travels! ✈️**