import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { StoreConfig } from '../types/index.ts';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Store,
  Eye,
  EyeOff,
  CheckCircle2,
  Boxes,
  Receipt,
  Shield,
  Activity
} from 'lucide-react';

interface LoginPageProps {
  onBackToStore?: () => void;
  config?: StoreConfig | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToStore, config }) => {
  const { login, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    }
  };

  const handleSelectRole = (role: 'admin' | 'staff') => {
    setError(null);
    if (role === 'admin') {
      setIdentifier('admin');
    } else {
      setIdentifier('staff');
    }
    setPassword('');
  };

  const storeName = config?.storeName || 'Apex Retail Mart';

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-center">
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12">
        {/* ========================================================= */}
        {/* LEFT PANEL: Deep Forest Green Brand & Enterprise Showcase */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 xl:col-span-5 bg-[#062c20] text-stone-100 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background ambient elements */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-lime-500/10 blur-3xl pointer-events-none" />

          {/* Top Brand & Back Link */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-bold text-base shadow-sm">
                  RF
                </div>
                <div>
                  <span className="font-extrabold text-lg tracking-tight text-white block leading-tight">
                    RetailFlow
                  </span>
                  <span className="text-[11px] text-emerald-300/80 font-mono tracking-wide uppercase">
                    Operations Portal
                  </span>
                </div>
              </div>

              {onBackToStore && (
                <button
                  onClick={onBackToStore}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs hover:bg-emerald-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Storefront</span>
                </button>
              )}
            </div>

            <div className="pt-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 text-xs font-medium mb-4">
                <Activity className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
                <span>Enterprise Core · Live Node</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
                Unified Retail Point-of-Sale & Stock Governance
              </h1>
              <p className="mt-3 text-stone-300 text-xs sm:text-sm leading-relaxed max-w-md">
                Secure staff workstation for real-time inventory reconciliation, high-velocity billing, and verified GST tax invoicing at {storeName}.
              </p>
            </div>
          </div>

          {/* Core Feature Pillars */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
              <div className="p-2 rounded-lg bg-emerald-900/80 text-emerald-300 shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Authoritative Stock Deductions</h4>
                <p className="text-[11px] text-stone-300/80 mt-0.5 leading-normal">
                  Strict backend race-condition prevention with automated low-stock reorder thresholds.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
              <div className="p-2 rounded-lg bg-emerald-900/80 text-emerald-300 shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">GST Invoicing & Multi-Payment</h4>
                <p className="text-[11px] text-stone-300/80 mt-0.5 leading-normal">
                  Unified terminal supporting Cash, UPI, Card, and Credit with server-calculated tax.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
              <div className="p-2 rounded-lg bg-emerald-900/80 text-emerald-300 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Strict Role-Based Access Control</h4>
                <p className="text-[11px] text-stone-300/80 mt-0.5 leading-normal">
                  Independent cashier terminal view vs. complete manager inventory & margin oversight.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Security Credentials Note */}
          <div className="relative z-10 pt-4 border-t border-emerald-900/60 flex items-center justify-between text-[11px] text-stone-400">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Session: Encrypted (JWT 24h)</span>
            </div>
            <span className="font-mono text-stone-400/80">GSTIN: {config?.gstin || '07AAAAA0000A1Z5'}</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: Clean Sign-in Form & Quick Role Selection   */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 xl:col-span-7 bg-[#faf9f6] flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative">
          {/* Top navigation for desktop */}
          {onBackToStore && (
            <div className="w-full max-w-md hidden lg:flex justify-end mb-4">
              <button
                onClick={onBackToStore}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all shadow-2xs group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-stone-400 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Customer Store</span>
              </button>
            </div>
          )}

          <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 text-[11px] font-semibold mb-2">
                <Lock className="w-3 h-3 text-stone-500" />
                <span>Restricted Employee Access</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-stone-900">
                Sign in to your workstation
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Enter your administrative or cashier credentials to access backoffice systems.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. admin or staff"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50/50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50/50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b] focus:border-transparent transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-[#064e3b] hover:bg-[#043d2e] text-white font-semibold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <span>{loading ? 'Authenticating Credentials...' : 'Sign In to Backoffice'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Role Selection (Requires Password - No Auto-Login) */}
            <div className="mt-6 pt-5 border-t border-stone-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">
                  Select Workstation Account
                </span>
                <span className="text-[10px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded font-medium">
                  Password Required
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectRole('admin')}
                  className={`p-3 border rounded-xl text-left transition-all group flex flex-col justify-between cursor-pointer ${
                    identifier === 'admin'
                      ? 'border-[#064e3b] bg-emerald-50/50 ring-1 ring-[#064e3b]'
                      : 'border-stone-200 hover:border-[#064e3b] hover:bg-stone-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#064e3b]" />
                      <span>Manager (Admin)</span>
                    </span>
                    {identifier === 'admin' && (
                      <span className="w-2 h-2 rounded-full bg-[#064e3b]" />
                    )}
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1 leading-snug">
                    Full catalog, margins, stock audits & reports
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole('staff')}
                  className={`p-3 border rounded-xl text-left transition-all group flex flex-col justify-between cursor-pointer ${
                    identifier === 'staff'
                      ? 'border-[#064e3b] bg-emerald-50/50 ring-1 ring-[#064e3b]'
                      : 'border-stone-200 hover:border-[#064e3b] hover:bg-stone-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cashier (Staff)</span>
                    </span>
                    {identifier === 'staff' && (
                      <span className="w-2 h-2 rounded-full bg-[#064e3b]" />
                    )}
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1 leading-snug">
                    Point of Sale checkout, inventory inquiry & billing
                  </p>
                </button>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-5 text-center">
              <p className="text-[11px] text-stone-400">
                Authoritative server-side JWT authentication & bcrypt password security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
