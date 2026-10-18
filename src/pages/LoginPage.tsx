import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api/client.ts';
import { StoreConfig } from '../types/index.ts';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Store,
  UserRound
} from 'lucide-react';

interface LoginPageProps {
  onBackToStore?: () => void;
  config?: StoreConfig | null;
}

type LoginRole = 'staff' | 'admin';

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToStore, config }) => {
  const { login, logout, loading } = useAuth();
  const [loginRole, setLoginRole] = useState<LoginRole>(() =>
    window.location.pathname === '/admin/login' ? 'admin' : 'staff'
  );
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await login(identifier.trim(), password);
      const { user: signedInUser } = await api.getMe();
      if (signedInUser.role !== loginRole) {
        await logout();
        setError(
          signedInUser.role === 'admin'
            ? 'This account has Admin access. Choose Admin sign in to continue.'
            : 'This account has Staff access. Choose Staff sign in to continue.'
        );
      }
    } catch (loginError: unknown) {
      await logout();
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in. Please try again.');
    }
  };

  const storeName = config?.storeName || 'RetailFlow';
  const selectedRoleLabel = loginRole === 'admin' ? 'Admin' : 'Staff';

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f7f5] text-slate-900">
      <div aria-hidden="true" className="pointer-events-none absolute -left-36 -top-44 h-[28rem] w-[28rem] rounded-full bg-emerald-100/80 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-lime-100/70 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <section className="flex min-w-0 flex-col px-6 pb-8 pt-7 sm:px-10 lg:px-14 lg:py-10 xl:px-20">
          <a href="/" className="inline-flex w-fit items-center gap-3 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07543f] text-base font-extrabold tracking-tight text-white shadow-lg shadow-emerald-950/15">RF</span>
            <span>
              <span className="block text-lg font-extrabold leading-tight tracking-tight text-slate-950">RetailFlow</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">Retail operations</span>
            </span>
          </a>

          <div className="my-10 max-w-xl sm:my-14 lg:my-auto lg:py-14">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-emerald-900 shadow-sm">
              <Activity className="h-4 w-4 text-emerald-600" />
              Your store, in sync
            </div>
            <h1 className="max-w-lg text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl xl:text-[3.5rem]">
              Welcome back to <span className="text-emerald-800">{storeName}</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
              Sign in to keep sales, stock, and daily store operations moving smoothly.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/75 p-4 shadow-sm shadow-emerald-950/[0.03]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Store className="h-[18px] w-[18px]" /></span>
                <span><span className="block text-sm font-bold text-slate-900">One clear workspace</span><span className="mt-1 block text-xs leading-5 text-slate-500">Sales and inventory in one place.</span></span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/75 p-4 shadow-sm shadow-emerald-950/[0.03]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><ShieldCheck className="h-[18px] w-[18px]" /></span>
                <span><span className="block text-sm font-bold text-slate-900">Access by role</span><span className="mt-1 block text-xs leading-5 text-slate-500">Each account sees the tools it needs.</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BadgeCheck className="h-4 w-4 text-emerald-700" />
            Secure sign in for your retail team
          </div>
        </section>

        <section className="flex min-w-0 items-center justify-center px-5 pb-10 sm:px-10 lg:px-12 lg:py-10">
          <div className="w-full max-w-[470px]">
            {onBackToStore && (
              <div className="mb-5 flex justify-end">
                <button
                  type="button"
                  onClick={onBackToStore}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to store
                </button>
              </div>
            )}

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_80px_-38px_rgba(15,57,42,0.3)] sm:p-9">
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Team workspace</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[1.8rem]">Sign in to continue</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Choose your account type, then enter your work credentials.</p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5" role="group" aria-label="Choose account type">
                <button
                  type="button"
                  aria-pressed={loginRole === 'staff'}
                  onClick={() => { setLoginRole('staff'); setError(null); }}
                  className={`flex min-h-[62px] items-center gap-3 rounded-xl px-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${loginRole === 'staff' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${loginRole === 'staff' ? 'bg-emerald-100 text-emerald-800' : 'bg-white/70 text-slate-500'}`}><UserRound className="h-[18px] w-[18px]" /></span>
                  <span><span className="block text-sm font-bold">Staff</span><span className="mt-0.5 block text-[11px] text-slate-500">Store operations</span></span>
                </button>
                <button
                  type="button"
                  aria-pressed={loginRole === 'admin'}
                  onClick={() => { setLoginRole('admin'); setError(null); }}
                  className={`flex min-h-[62px] items-center gap-3 rounded-xl px-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${loginRole === 'admin' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${loginRole === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-white/70 text-slate-500'}`}><KeyRound className="h-[18px] w-[18px]" /></span>
                  <span><span className="block text-sm font-bold">Admin</span><span className="mt-0.5 block text-[11px] text-slate-500">Management access</span></span>
                </button>
              </div>

              {error && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="employee-identifier" className="mb-2 block text-sm font-semibold text-slate-800">Username or email</label>
                  <div className="relative">
                    <UserRound aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="employee-identifier"
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="Enter your username or email"
                      className="min-h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="employee-password" className="mb-2 block text-sm font-semibold text-slate-800">Password</label>
                  <div className="relative">
                    <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="employee-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="min-h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#07543f] px-5 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-[#064431] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-wait disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : `Sign in as ${selectedRoleLabel}`}
                  {!loading && <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Your account role controls what you can access.
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">Need an account? Ask your store administrator.</p>
          </div>
        </section>
      </div>
    </main>
  );
};
