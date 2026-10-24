import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { Search, Filter, AlertCircle, ArrowRight, RefreshCw, FolderSearch } from 'lucide-react';

interface MyCasesViewProps {
  onSelectCase: (caseItem: { id: string; report_type: 'lost' | 'found' }) => void;
  onNavigate: (view: string) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const MyCasesView: React.FC<MyCasesViewProps> = ({ onSelectCase, onNavigate, onOpenAuth }) => {
  const { user, quickLogin } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyCases();
      if (res.success) {
        setCases(res.cases || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCases();
    }
  }, [user]);

  const filteredCases = cases.filter((c) => {
    if (typeFilter !== 'all' && c.report_type !== typeFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRef = c.case_reference.toLowerCase().includes(q);
      const matchFlight = c.flight_number?.toLowerCase().includes(q);
      const matchRoute = c.route?.toLowerCase().includes(q);
      const matchBrand = c.brand?.toLowerCase().includes(q);
      const matchColor = c.color?.toLowerCase().includes(q);
      if (!matchRef && !matchFlight && !matchRoute && !matchBrand && !matchColor) return false;
    }
    return true;
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4">
          <FolderSearch className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In to Track Your Cases</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Your reported lost bags and logged items are associated with your verified passenger profile.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => onOpenAuth && onOpenAuth('login')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B192C] hover:bg-slate-800 rounded-md transition-colors cursor-pointer shadow-xs"
          >
            Sign In / Register
          </button>
          <button
            type="button"
            onClick={() => quickLogin('passenger')}
            className="px-5 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
          >
            Instant Demo Passenger (Emma Watson)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">Passenger Case Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">My Baggage Cases</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time status milestones, review match alerts, and respond to staff verification queries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCases}
            disabled={loading}
            className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
            title="Refresh Cases"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('report-lost')}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-xs"
          >
            + Report Lost Bag
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Segmented Type Controls (Interactive Button Tabs) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Cases ({cases.length})
            </button>
            <button
              onClick={() => setTypeFilter('lost')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                typeFilter === 'lost' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost Bags ({cases.filter((c) => c.report_type === 'lost').length})
            </button>
            <button
              onClick={() => setTypeFilter('found')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                typeFilter === 'found' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Found Luggage ({cases.filter((c) => c.report_type === 'found').length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Reported</option>
                <option value="under_review">Under Review</option>
                <option value="potential_match_found">Potential Match</option>
                <option value="verification_pending">Verification Pending</option>
                <option value="ownership_verified">Ownership Verified</option>
                <option value="recovery_arranged">Handover Ready</option>
                <option value="recovered_and_closed">Recovered & Closed</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, flight, color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-600 w-48 sm:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Case List Table / Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <span>Loading passenger records...</span>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Baggage Cases Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'No reports match your active filters. Try clearing your search parameters.'
              : "You haven't filed any baggage reports yet. Click below to begin."}
          </p>
          <div className="mt-5">
            <button
              onClick={() => onNavigate('report-lost')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-xs transition-colors"
            >
              Report Lost Bag Now
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Case Reference</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Flight / Airport</th>
                  <th className="py-3.5 px-4">Luggage Spec</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      <span>{c.case_reference}</span>
                      <div className="text-[11px] text-slate-400 font-normal font-sans">
                        Filed {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="capitalize font-medium text-slate-800">
                        {c.report_type === 'lost' ? 'Lost Bag Claim' : 'Found Baggage'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {c.flight_number ? (
                        <div>
                          <span className="font-semibold text-slate-900 font-mono">{c.flight_number}</span>
                          <div className="text-slate-500 text-[11px]">{c.route}</div>
                        </div>
                      ) : (
                        <div className="text-slate-700 font-medium">{c.route}</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-900 font-medium">
                        {c.color} {c.category.replace(/_/g, ' ')}
                      </div>
                      {c.brand && <div className="text-[11px] text-slate-500">Brand: {c.brand}</div>}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={c.status} />
                      {c.has_pending_verification && (
                        <div className="mt-1 text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                          <span>Action Required: Answer verification</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onSelectCase({ id: c.id, report_type: c.report_type })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded transition-colors whitespace-nowrap"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
