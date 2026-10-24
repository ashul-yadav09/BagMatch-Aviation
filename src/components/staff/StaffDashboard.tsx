import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { OperationalStats } from '../../types';
import {
  Briefcase,
  AlertTriangle,
  GitCompare,
  Clock,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import staffOfficerImg from '../../assets/images/avatar_staff_officer_1792825287860.jpg';
import inspectionHubImg from '../../assets/images/baggage_inspection_hub_1792825287912.jpg';

interface StaffDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OperationalStats | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.stats);
        setActivity(res.recentActivity || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Staff Header with Officer Card */}
      <div className="bg-[#0B192C] text-white rounded-xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-blue-400/50 shadow-md bg-slate-800 shrink-0">
              <img
                src={staffOfficerImg}
                alt="Airport Baggage Officer"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-blue-300 font-semibold">
                  Aviation Baggage Control Unit
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-teal-400 font-semibold font-mono">ACTIVE DUTY</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                Staff Operations Console
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Officer <strong className="text-white">{user?.full_name}</strong> · {user?.department || 'Terminal Operations'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
              title="Refresh Statistics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onNavigateTab('staff-matches')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-xs"
            >
              Review Potential Matches
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Database-Backed Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigateTab('staff-reports')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Lost Reports</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
            {stats ? stats.openLostCount : '-'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unresolved passenger claims</p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigateTab('staff-reports')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Found Awaiting Review</span>
            <Briefcase className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
            {stats ? stats.foundAwaitingReview : '-'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Items secured in custody</p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigateTab('staff-matches')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Potential Matches</span>
            <GitCompare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
            {stats ? stats.matchesAwaitingReview : '-'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Algorithmic candidates</p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigateTab('staff-recovery')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Verification</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
            {stats ? stats.verificationsPending : '-'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting passenger answer/review</p>
        </div>

        {/* Metric 5 */}
        <div
          onClick={() => onNavigateTab('staff-recovery')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors cursor-pointer col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Recovered Cases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-700">
            {stats ? stats.recoveredCount : '-'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <TrendingUp className="w-3 h-3 inline text-emerald-600 mr-1" />
            {stats ? `${stats.recoveryRate}% overall rate` : ''}
          </p>
        </div>
      </div>

      {/* Operational Inspection & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection Hub Photo & Directives */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="relative h-44 bg-slate-900">
              <img
                src={inspectionHubImg}
                alt="Baggage inspection carousel hub"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                <p className="text-xs font-semibold text-white">Baggage Verification Vault B</p>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Airport Operational Directives
              </h3>
              <ul className="mt-3 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>Cross-reference airline barcode tag and baggage claim stub where available.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>Always request secondary verification (lock code or contents) before releasing items.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>Inspect photo ID at counter handover and complete official handover record.</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="p-5 pt-0">
            <button
              onClick={() => onNavigateTab('staff-recovery')}
              className="w-full py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Manage Handover & Recovery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live System Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Recent Operational Activity
              </h3>
              <span className="text-xs text-slate-400 font-mono">Real Audit Trail</span>
            </div>

            {activity.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No recent activity recorded.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                {activity.map((act) => (
                  <div key={act.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 font-mono text-[11px]">
                          {act.action}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">{act.user_email || 'System'}</span>
                        {act.user_role && (
                          <span className="text-[10px] uppercase font-semibold text-slate-400 px-1 bg-slate-100 rounded">
                            {act.user_role}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 mt-0.5 text-[11px] truncate max-w-md">
                        Entity: {act.entity_type} ({act.entity_id})
                        {act.details?.case_reference ? ` · Ref: ${act.details.case_reference}` : ''}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-slate-400 font-mono whitespace-nowrap tabular-nums">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigateTab('staff-reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All Reports in Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
