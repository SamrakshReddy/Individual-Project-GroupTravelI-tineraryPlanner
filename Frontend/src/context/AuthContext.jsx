import { createContext, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const navigate = useNavigate();

  async function login(credentials) {
    const response = await loginUser(credentials);
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
  }

  async function register(userDetails) {
    const response = await registerUser(userDetails);
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  }

  const value = useMemo(() => ({ token, login, register, logout }), [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
