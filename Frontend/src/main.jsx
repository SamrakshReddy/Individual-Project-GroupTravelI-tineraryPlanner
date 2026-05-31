import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';
import Settings from './pages/Settings.jsx';
import AITripPlanner from './pages/AITripPlanner.jsx';
import TripDetails from './pages/TripDetails.jsx';
import Trips from './pages/Trips.jsx';
import './styles.css';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

const container = document.getElementById('root');
const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

const app = (
  <React.StrictMode>
    <BrowserRouter future={routerFutureFlags}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <App />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="ai-planner" element={<AITripPlanner />} />
                <Route path="trips" element={<Trips />} />
                <Route path="trips/:tripId" element={<TripDetails />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

if (!container._reactRoot) {
  container._reactRoot = ReactDOM.createRoot(container);
}

container._reactRoot.render(app);
