import { Compass, Loader2, Plane } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../utils/formatters';

export default function Login() {
  const { token, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    try {
      await login(form);
      showToast('Signed in successfully', 'success');
      navigate('/dashboard');
    } catch (error) {
      showToast(getErrorMessage(error, 'Login failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to keep planning your group adventures.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="field" id="email" name="email" onChange={updateField} placeholder="you@example.com" required type="email" value={form.email} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="field" id="password" name="password" onChange={updateField} placeholder="Enter your password" required type="password" value={form.password} />
        </div>
        <button className="btn-primary w-full py-3" disabled={isLoading} type="submit">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        New here? <Link className="font-semibold text-indigo-600 dark:text-indigo-300" to="/register">Create an account</Link>
      </p>
    </AuthScreen>
  );
}

export function AuthScreen({ title, subtitle, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.8),transparent_34%),linear-gradient(135deg,#f0f9ff_0%,#ffffff_48%,#ecfdf5_100%)] px-4 py-10 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_100%)]">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-sky-900/15 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-gradient-to-br from-sky-200 via-white to-emerald-100 p-8 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-500/25">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-950 dark:text-white">Travel Planner</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Group trips, calmer budgets</p>
            </div>
          </div>
          <div className="py-10">
            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full bg-white/70 text-sky-600 shadow-xl shadow-sky-900/10 dark:bg-slate-950/60 dark:text-sky-300">
              <Compass className="h-24 w-24" />
            </div>
            <h2 className="mt-8 text-3xl font-bold leading-tight text-slate-950 dark:text-white">Plan every route, stay, and shared cost in one place.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">A soft workspace for group travel itineraries, budgets, activities, and expenses.</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-500/25 lg:hidden">
              <Plane className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
