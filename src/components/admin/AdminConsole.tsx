import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, AuditLog, UserRole } from '../../types';
import {
  ShieldAlert,
  Users,
  Shield,
  Activity,
  RefreshCw,
  CheckCircle2,
  KeyRound,
  Sliders,
} from 'lucide-react';

export const AdminConsole: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Settings state
  const [matchingThreshold, setMatchingThreshold] = useState(50);
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, logsRes] = await Promise.all([api.getUsers(), api.getAuditLogs(100)]);
      if (usersRes.success) {
        setUsers(usersRes.users || []);
      }
      if (logsRes.success) {
        setAuditLogs(logsRes.logs || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.updateUserRole(userId, newRole);
      if (res.success) {
        setSuccessMessage(`User role updated to ${newRole.toUpperCase()}.`);
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change role.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">Protected Super-Admin Area</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            System Administration & Security
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage user accounts, assign verified airport staff credentials, and audit security events.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-md transition-colors self-start md:self-auto"
          title="Refresh Admin Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {successMessage && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-900 font-bold">&times;</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-md border border-rose-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: User & Staff Role Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              User Accounts & Role Permissions
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {users.length} Registered Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{u.full_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{u.id}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-slate-900 text-white'
                          : u.role === 'staff'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 tabular-nums">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="passenger">Passenger</option>
                      <option value="staff">Airport Staff</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Operational Engine Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Engine & AI Operational Configuration
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Minimum Candidate Match Threshold</span>
              <span className="font-mono font-bold text-blue-600">{matchingThreshold}%</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Reports scoring below this cut-off are considered non-matching and not presented to passengers.
            </p>
            <input
              type="range"
              min={30}
              max={80}
              step={5}
              value={matchingThreshold}
              onChange={(e) => setMatchingThreshold(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Gemini AI Semantic Analysis</span>
              <span className="font-mono font-semibold text-teal-700">
                {aiAssistanceEnabled ? 'ACTIVE (gemini-3.8-flash)' : 'DISABLED'}
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Assists airport staff with deep linguistic normalization, luggage feature extraction, and verification guidance.
            </p>
            <button
              onClick={() => setAiAssistanceEnabled(!aiAssistanceEnabled)}
              className="px-3 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-100"
            >
              Toggle AI Integration
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Audit Trail & System Security Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              System Audit Logs & Security History
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {auditLogs.length} Events Recorded
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold sticky top-0">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Initiating User</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {log.user_email || 'System'}
                    {log.user_role ? ` (${log.user_role})` : ''}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {log.entity_type}:{log.entity_id}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 tabular-nums">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
