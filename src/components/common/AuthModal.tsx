import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck } from 'lucide-react';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, quickLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ full_name: fullName, email, password, phone });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setError(null);
    setSubmitting(true);
    try {
      await quickLogin(role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden cursor-default">
        {/* Header banner in Aviation Navy */}
        <div className="bg-[#0B192C] px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-blue-300 font-semibold">BagMatch Identity</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {mode === 'login' ? 'Sign In to BagMatch' : 'Create Passenger Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Emma Watson"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 014-9988"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#0B192C] hover:bg-[#162a45] text-white text-sm font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="text-xs text-blue-700 hover:text-blue-900 font-medium"
            >
              {mode === 'login'
                ? "Don't have an account? Create passenger profile"
                : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Instant Demo Account Sign-In</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('passenger')}
                className="py-1.5 px-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-center transition-colors truncate"
                title="Passenger: Emma Watson"
              >
                Passenger
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="py-1.5 px-2 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-center transition-colors truncate"
                title="Airport Staff: Sarah Jenkins"
              >
                Airport Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-1.5 px-2 text-xs font-medium text-slate-900 bg-slate-200 hover:bg-slate-300 border border-slate-300 rounded text-center transition-colors truncate"
                title="Admin: Marcus Vance"
              >
                Admin
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 text-center">
              Each demo role authenticates with real hashed passwords and server-enforced permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
