import React, { useState, useEffect } from 'react';
import { useCustomerAuth } from '../context/CustomerAuthContext.tsx';
import {
  X,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  storeName?: string;
  onSuccess?: () => void;
  onOpenStaffPortal?: () => void;
}

// Elegant brand leaf logo matching the design reference (#0F5132 primary)
const BrandLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7 text-[#0F5132]' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor">
    <path
      d="M16 2.5C16 2.5 19 9 26 10.5C26 18.5 19 23 16 29.5C13 23 6 18.5 6 10.5C13 9 16 2.5 16 2.5Z"
      opacity="0.2"
    />
    <path
      d="M16 4C16 4 19 10.5 25.5 12C25.5 19 19.5 23 16 28C16 28 18 19 16 13.5C14 19 16 28 16 28C12.5 23 6.5 19 6.5 12C13 10.5 16 4 16 4Z"
    />
  </svg>
);

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  storeName = 'Apex Retail Mart',
  onSuccess,
  onOpenStaffPortal
}) => {
  const { login, register } = useCustomerAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status: 'idle' | 'loading' | 'success' | 'error'
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Validation helpers
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isLoginEmailValid = emailRegex.test(loginEmail.trim());
  const isLoginPasswordValid = loginPassword.length >= 6;

  const isRegEmailValid = emailRegex.test(regEmail.trim());
  const isRegPasswordValid = regPassword.length >= 6;
  const isRegConfirmValid = regConfirmPassword.length >= 6 && regConfirmPassword === regPassword;
  const isRegNameValid = regFullName.trim().length >= 2;

  useEffect(() => {
    setActiveTab(initialTab);
    setStatus('idle');
    setError(null);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setError('Please provide your email address and password.');
      return;
    }

    if (!isLoginEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      await login(loginEmail.trim(), loginPassword);
      setStatus('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 750);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Invalid email address or password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regFullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!regEmail.trim() || !isRegEmailValid) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setStatus('loading');
    try {
      await register(regFullName.trim(), regEmail.trim(), regPassword);
      setStatus('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 750);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to create customer account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative my-4 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_100px_-32px_rgba(2,24,17,0.65)] md:my-0 md:grid-cols-[0.92fr_1.08fr] md:max-h-[min(760px,calc(100dvh-2.5rem))] animate-in zoom-in-95 duration-200">
        <aside className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#03271d] via-[#064e3b] to-[#0b6848] p-9 text-white md:flex">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-lime-300/10 blur-2xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-50">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
              YOUR EVERYDAY STORE
            </div>
            <h2 className="mt-8 max-w-sm text-4xl font-extrabold leading-[1.08] tracking-tight">
              A better way to shop for <span className="text-lime-300">everyday.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50/75">
              Sign in to pick up where you left off and keep your orders close at hand.
            </p>
          </div>
          <div className="relative z-10 my-8 flex h-56 items-center justify-center">
            <div className="absolute h-48 w-48 rounded-full border border-lime-200/15 bg-emerald-950/20" />
            <div className="absolute h-36 w-36 rounded-full border border-white/10" />
            <div className="absolute left-[12%] top-[14%] -rotate-12 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-xl backdrop-blur-sm">
              <ShoppingBag className="h-7 w-7 text-lime-300" />
            </div>
            <div className="relative flex h-36 w-36 rotate-3 items-center justify-center rounded-[30px] border border-lime-200/40 bg-gradient-to-br from-lime-300 to-lime-500 text-[#073a29] shadow-[0_24px_60px_-20px_rgba(163,230,53,0.8)]">
              <ShoppingBag className="h-16 w-16 stroke-[1.5]" />
              <span className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-[#07513a] bg-white text-[#07513a]">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            <span className="absolute bottom-[15%] right-[12%] rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
              Your orders, all in one place
            </span>
          </div>
          <div className="relative z-10 border-t border-white/15 pt-5">
            <p className="text-xs font-medium text-emerald-50/65">A simple, secure shopping experience</p>
          </div>
        </aside>
        <div className="relative min-w-0 bg-white md:max-h-[min(760px,calc(100dvh-2.5rem))] md:overflow-y-auto">
        {/* Top Controls: Back button on Register & Always Visible Accessible Close Button */}
        <div className="absolute top-4 left-4 z-20">
          {activeTab === 'register' && status === 'idle' && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className="p-2 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              aria-label="Back to Sign In"
              title="Back to Sign In"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close authentication modal"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Overlay (Panel 3 Reference) */}
        {status === 'loading' && (
          <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
              <div className="w-9 h-9 border-3 border-[#0F5132] border-t-transparent rounded-full animate-spin" />
            </div>
            <h4 className="text-lg font-bold text-stone-900">
              {activeTab === 'login' ? 'Logging you in...' : 'Creating your account...'}
            </h4>
            <p className="text-xs text-stone-500 mt-1">Please wait a moment</p>
          </div>
        )}

        {/* Success Overlay (Panel 4 Reference) */}
        {status === 'success' && (
          <div className="absolute inset-0 z-30 bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0F5132] border border-emerald-200 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#0F5132]" />
            </div>
            <h4 className="text-xl font-bold text-stone-900">
              {activeTab === 'login' ? 'Login Successful!' : 'Account Created!'}
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              Welcome back to your account. Continuing your shopping session...
            </p>
            <button
              onClick={() => {
                onSuccess?.();
                onClose();
              }}
              className="mt-5 py-2.5 px-6 rounded-xl font-bold text-xs bg-[#0F5132] text-white hover:bg-[#0A3622] transition flex items-center gap-1.5"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Branded Header (No product info) */}
        <div className="border-b border-stone-100 bg-gradient-to-b from-emerald-50/80 via-white to-white px-6 pb-5 pt-12 text-center sm:px-9 md:pt-10">
          {/* Elegant Leaf Logo */}
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-[#0F5132] shadow-sm">
            <BrandLogo className="w-7 h-7 text-[#0F5132]" />
          </div>

          <div className="inline-block text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0F5132]">
            {storeName}
          </div>
          <p className="text-[11px] text-stone-400 font-medium">Your everyday shopping, made simpler.</p>

          <h2 className="mt-3 text-[27px] font-extrabold tracking-tight text-stone-900">
            {activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1 leading-relaxed">
            {activeTab === 'login'
              ? 'Sign in to continue shopping, manage your orders, and enjoy a seamless checkout experience.'
              : 'Join us and get started to save your shopping cart, view orders, and enjoy fast checkout.'}
          </p>
        </div>

        {/* Main Form Body */}
        <div className="px-6 py-6 sm:px-9">
          {error && status === 'error' && (
            <div role="alert" aria-live="polite" className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Email Input */}
              <div>
                <label htmlFor="customer-login-email" className="mb-1 block text-xs font-semibold text-stone-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="customer-login-email"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="user@gmail.com"
                    required
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-hidden ${
                      loginEmail && isLoginEmailValid
                        ? 'border-emerald-500 focus:ring-2 focus:ring-[#0F5132] bg-white'
                        : loginEmail && !isLoginEmailValid
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20'
                        : 'border-stone-300 focus:ring-2 focus:ring-[#0F5132] bg-white'
                    }`}
                  />
                  {loginEmail && isLoginEmailValid && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {loginEmail && !isLoginEmailValid && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    Please enter a valid email address.
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="customer-login-password" className="mb-1 block text-xs font-semibold text-stone-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="customer-login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-hidden ${
                      loginPassword && isLoginPasswordValid
                        ? 'border-emerald-500 focus:ring-2 focus:ring-[#0F5132] bg-white'
                        : 'border-stone-300 focus:ring-2 focus:ring-[#0F5132] bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Options: Remember me */}
              {/* Primary Login Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-[#0F5132] hover:bg-[#0A3622] text-white shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                <span>Sign In & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* OR Divider */}
              <div className="relative my-3 pt-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-stone-400 font-semibold font-mono text-[10px]">
                    OR
                  </span>
                </div>
              </div>

              {/* Employee Portal Access Button */}
              {onOpenStaffPortal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStaffPortal();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 cursor-pointer"
                >
                  <Lock className="h-4 w-4 text-[#0F5132]" />
                  <span>Employee Portal</span>
                </button>
              )}

              {/* Switch to Register link */}
              <div className="text-center text-xs text-stone-500 pt-2">
                New to {storeName}?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError(null);
                  }}
                  className="text-[#0F5132] font-bold hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Full Name */}
              <div>
                <label htmlFor="customer-register-name" className="mb-1 block text-xs font-semibold text-stone-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="customer-register-name"
                    type="text"
                    autoComplete="name"
                    value={regFullName}
                    onChange={(e) => {
                      setRegFullName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g. Jane Doe"
                    required
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-hidden ${
                      regFullName && isRegNameValid
                        ? 'border-emerald-500 focus:ring-2 focus:ring-[#0F5132] bg-white'
                        : 'border-stone-300 focus:ring-2 focus:ring-[#0F5132] bg-white'
                    }`}
                  />
                  {regFullName && isRegNameValid && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="customer-register-email" className="mb-1 block text-xs font-semibold text-stone-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="customer-register-email"
                    type="email"
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="user@gmail.com"
                    required
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-hidden ${
                      regEmail && isRegEmailValid
                        ? 'border-emerald-500 focus:ring-2 focus:ring-[#0F5132] bg-white'
                        : regEmail && !isRegEmailValid
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20'
                        : 'border-stone-300 focus:ring-2 focus:ring-[#0F5132] bg-white'
                    }`}
                  />
                  {regEmail && isRegEmailValid && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {regEmail && !isRegEmailValid && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    Please enter a valid email address.
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="customer-register-password" className="mb-1 block text-xs font-semibold text-stone-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="customer-register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-hidden ${
                      regPassword && isRegPasswordValid
                        ? 'border-emerald-500 focus:ring-2 focus:ring-[#0F5132] bg-white'
                        : 'border-stone-300 focus:ring-2 focus:ring-[#0F5132] bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regPassword && !isRegPasswordValid && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    Password must be at least 6 characters.
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="customer-register-confirm-password" className="mb-1 block text-xs font-semibold text-stone-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="customer-register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-hidden ${
                      regConfirmPassword && isRegConfirmValid
                        ? 'border-emerald-500 focus:ring-2 focus:ring-[#0F5132] bg-white'
                        : regConfirmPassword && !isRegConfirmValid
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20'
                        : 'border-stone-300 focus:ring-2 focus:ring-[#0F5132] bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regConfirmPassword && !isRegConfirmValid && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    Passwords do not match.
                  </p>
                )}
                {regConfirmPassword && isRegConfirmValid && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Primary Register Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-[#0F5132] hover:bg-[#0A3622] text-white shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Switch back to Login */}
              <div className="text-center text-xs text-stone-500 pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                  }}
                  className="text-[#0F5132] font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
