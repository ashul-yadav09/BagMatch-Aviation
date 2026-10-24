import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LostReport, FoundReport } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Search, Filter, RefreshCw, Eye, AlertCircle } from 'lucide-react';
import { CaseDetailModal } from '../passenger/CaseDetailModal';

export const StaffReportsView: React.FC = () => {
  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  const [foundReports, setFoundReports] = useState<FoundReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [airportFilter, setAirportFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCase, setSelectedCase] = useState<{ id: string; report_type: 'lost' | 'found' } | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStaffReports({
        type: activeTab === 'all' ? undefined : activeTab,
        status: statusFilter === 'all' ? undefined : statusFilter,
        airport: airportFilter || undefined,
        query: searchQuery || undefined,
      });
      if (res.success) {
        setLostReports(res.lostReports || []);
        setFoundReports(res.foundReports || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [activeTab, statusFilter, airportFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports();
  };

  const combinedReports = [
    ...lostReports.map((l) => ({
      ...l,
      report_type: 'lost' as const,
      identifier: l.flight_number,
      locationSummary: `${l.departure_airport} -> ${l.arrival_airport}`,
    })),
    ...foundReports.map((f) => ({
      ...f,
      report_type: 'found' as const,
      identifier: f.airport,
      locationSummary: `${f.airport} (${f.terminal_area})`,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">Operations Repository</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Baggage Reports Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, and inspect verified airline lost luggage claims and found baggage logs.
          </p>
        </div>

        <button
          onClick={loadReports}
          disabled={loading}
          className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors self-start md:self-auto"
          title="Refresh Directory"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Segmented Type Controls (Interactive Button Tabs) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({lostReports.length + foundReports.length})
            </button>
            <button
              onClick={() => setActiveTab('lost')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'lost' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost Bags ({lostReports.length})
            </button>
            <button
              onClick={() => setActiveTab('found')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'found' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Found Baggage ({foundReports.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="logged">Logged in Custody</option>
                <option value="under_review">Under Review</option>
                <option value="potential_match_found">Potential Match</option>
                <option value="verification_pending">Verification Pending</option>
                <option value="ownership_verified">Ownership Verified</option>
                <option value="recovery_arranged">Handover Ready</option>
                <option value="recovered_and_closed">Recovered & Closed</option>
              </select>
            </div>

            {/* Airport input */}
            <input
              type="text"
              placeholder="Airport (e.g. SFO)"
              value={airportFilter}
              onChange={(e) => setAirportFilter(e.target.value.toUpperCase())}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 w-28 uppercase focus:outline-hidden"
            />

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search case, color, brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden w-48 sm:w-56"
              />
            </form>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-md border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Querying baggage database...</span>
          </div>
        ) : combinedReports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No baggage reports found matching current parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Case Reference</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Flight / Airport</th>
                  <th className="py-3.5 px-4">Luggage Attributes</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Filed / Logged</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {combinedReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {r.case_reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold capitalize ${
                          r.report_type === 'lost' ? 'text-blue-700' : 'text-teal-700'
                        }`}
                      >
                        {r.report_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 font-mono">{r.identifier}</div>
                      <div className="text-[11px] text-slate-500">{r.locationSummary}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 capitalize">
                        {r.color} {r.bag_category.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {r.brand ? `Brand: ${r.brand} · ` : ''}Size: {r.size}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 tabular-nums">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCase({ id: r.id, report_type: r.report_type })}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Case</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCase && (
        <CaseDetailModal
          caseId={selectedCase.id}
          reportType={selectedCase.report_type}
          onClose={() => setSelectedCase(null)}
          onRefreshList={loadReports}
        />
      )}
    </div>
  );
};
