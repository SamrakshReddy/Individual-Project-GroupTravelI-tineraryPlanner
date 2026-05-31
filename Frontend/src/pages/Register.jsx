import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../utils/formatters';
import { AuthScreen } from './Login.jsx';

export default function Register() {
  const { token, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    try {
      await register(form);
      showToast('Account created successfully', 'success');
      navigate('/dashboard');
    } catch (error) {
      showToast(getErrorMessage(error, 'Registration failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthScreen title="Create account" subtitle="Start planning shared itineraries, budgets, and activities.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input className="field" id="username" name="username" onChange={updateField} placeholder="Traveler" required type="text" value={form.username} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="field" id="email" name="email" onChange={updateField} placeholder="you@example.com" required type="email" value={form.email} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="field" id="password" minLength="6" name="password" onChange={updateField} placeholder="Create a password" required type="password" value={form.password} />
        </div>
        <button className="btn-primary w-full py-3" disabled={isLoading} type="submit">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {isLoading ? 'Creating...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already registered? <Link className="font-semibold text-indigo-600 dark:text-indigo-300" to="/login">Sign in</Link>
      </p>
    </AuthScreen>
  );
}
