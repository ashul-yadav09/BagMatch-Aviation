import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User as UserIcon, Mail, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.updateProfile({ full_name: fullName, phone });
      if (res.success) {
        await refreshUser();
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">Passenger Account</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Profile & Preferences</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your verified traveler credentials used during airport luggage handovers.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        {success && (
          <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile updated successfully.</span>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-slate-400 font-normal">(Primary Identifier)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-md cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Account Role: <strong className="uppercase font-mono text-slate-900">{user.role}</strong> · Member since {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] hover:bg-slate-800 rounded-md shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
