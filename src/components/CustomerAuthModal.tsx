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
  Sparkles
} from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
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
  onSuccess,
  onOpenStaffPortal
}) => {
  const { login, register, demoLogin } = useCustomerAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

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

  const handleDemoLogin = async () => {
    setError(null);
    setStatus('loading');
    try {
      await demoLogin();
      setStatus('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 750);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Demo customer sign-in failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200/90 flex flex-col relative my-6 animate-in zoom-in-95 duration-200">
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
        <div className="pt-8 pb-4 px-6 sm:px-8 text-center bg-gradient-to-b from-emerald-50/50 via-white to-white border-b border-stone-100">
          {/* Elegant Leaf Logo */}
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0F5132] border border-emerald-100/90 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
            <BrandLogo className="w-7 h-7 text-[#0F5132]" />
          </div>

          <div className="inline-block text-[11px] font-extrabold text-[#0F5132] uppercase tracking-wider">
            RetailFlow
          </div>
          <p className="text-[11px] text-stone-400 font-medium">Your everyday shopping, made simpler.</p>

          <h2 className="text-2xl font-extrabold text-[#0F5132] tracking-tight mt-2">
            {activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1 leading-relaxed">
            {activeTab === 'login'
              ? 'Sign in to continue shopping, manage your orders, and enjoy a seamless checkout experience.'
              : 'Join us and get started to save your shopping cart, view orders, and enjoy fast checkout.'}
          </p>
        </div>

        {/* Main Form Body */}
        <div className="px-6 sm:px-8 py-5">
          {error && status === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
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
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-stone-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-stone-300 text-[#0F5132] focus:ring-[#0F5132] accent-[#0F5132]"
                  />
                  <span>Remember me</span>
                </label>
              </div>

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
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStaffPortal?.();
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#0F5132]" />
                <span>Employee Portal</span>
              </button>

              {/* Switch to Register link */}
              <div className="text-center text-xs text-stone-500 pt-2">
                New to RetailFlow?{' '}
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
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
  );
};
