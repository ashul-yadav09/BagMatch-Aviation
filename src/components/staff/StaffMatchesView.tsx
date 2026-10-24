import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BagMatchRecord } from '../../types';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Send,
  AlertTriangle,
  X,
  Plane,
  Briefcase,
} from 'lucide-react';

export const StaffMatchesView: React.FC = () => {
  const [matches, setMatches] = useState<BagMatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // AI analysis state
  const [analyzingMatchId, setAnalyzingMatchId] = useState<string | null>(null);

  // Verification Request Modal
  const [selectedMatchForVerification, setSelectedMatchForVerification] = useState<BagMatchRecord | null>(null);
  const [verificationQuestions, setVerificationQuestions] = useState<string[]>([
    'Please state the 3-digit TSA lock combination, if set.',
    'Describe 2-3 specific non-sensitive articles located inside the front zippered compartment.',
  ]);
  const [dispatchingVerification, setDispatchingVerification] = useState(false);

  // Rejection modal
  const [selectedMatchForRejection, setSelectedMatchForRejection] = useState<BagMatchRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Physical inspection revealed discrepancy in dimensions/branding');
  const [dispatchingRejection, setDispatchingRejection] = useState(false);

  // Batch Rematch
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMatches({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      if (res.success) {
        setMatches(res.matches || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [statusFilter]);

  const handleRunBatch = async () => {
    setBatchRunning(true);
    setBatchMessage(null);
    try {
      const res = await api.runBatchMatching();
      if (res.success) {
        setBatchMessage(res.message);
        loadMatches();
      }
    } catch (err: any) {
      setError(err.message || 'Batch match execution failed.');
    } finally {
      setBatchRunning(false);
    }
  };

  const handleAiAnalysis = async (matchId: string) => {
    setAnalyzingMatchId(matchId);
    try {
      const res = await api.runAiAnalysis(matchId);
      if (res.success) {
        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? { ...m, explanation: res.explanation } : m))
        );
      }
    } catch (err: any) {
      setError(err.message || 'AI analysis request failed.');
    } finally {
      setAnalyzingMatchId(null);
    }
  };

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchForVerification) return;
    setDispatchingVerification(true);
    setError(null);

    try {
      const validQuestions = verificationQuestions.filter((q) => q.trim().length > 0);
      const res = await api.requestVerification(selectedMatchForVerification.id, validQuestions);
      if (res.success) {
        setSelectedMatchForVerification(null);
        loadMatches();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification request.');
    } finally {
      setDispatchingVerification(false);
    }
  };

  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchForRejection) return;
    setDispatchingRejection(true);
    setError(null);

    try {
      const res = await api.reviewMatch(selectedMatchForRejection.id, 'rejected', rejectionReason);
      if (res.success) {
        setSelectedMatchForRejection(null);
        loadMatches();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record rejection.');
    } finally {
      setDispatchingRejection(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Cross-Referencing Engine</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Potential Baggage Matches</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review algorithmic multi-factor correlations, trigger Gemini AI analysis, and dispatch verification questions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunBatch}
            disabled={batchRunning}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${batchRunning ? 'animate-spin' : ''}`} />
            <span>{batchRunning ? 'Evaluating...' : 'Run Matrix Rematch'}</span>
          </button>
          <button
            onClick={loadMatches}
            disabled={loading}
            className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-md transition-colors"
            title="Refresh Matches"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {batchMessage && (
        <div className="p-3 text-xs text-teal-800 bg-teal-50 border border-teal-200 rounded-md flex items-center justify-between">
          <span>{batchMessage}</span>
          <button onClick={() => setBatchMessage(null)} className="text-teal-900 font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-md border border-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Matches
        </button>
        <button
          onClick={() => setStatusFilter('potential')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            statusFilter === 'potential' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setStatusFilter('accepted')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            statusFilter === 'accepted' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Accepted for Verification
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            statusFilter === 'rejected' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Disqualified
        </button>
      </div>

      {/* Match Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          <span>Loading candidate matches...</span>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
          No matches found matching filter.
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => {
            const isHighConfidence = m.score >= 80;
            const isModerate = m.score >= 50 && m.score < 80;

            return (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {/* Score Dial */}
                    <div
                      className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center shrink-0 ${
                        isHighConfidence
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : isModerate
                          ? 'border-amber-500 bg-amber-50 text-amber-800'
                          : 'border-slate-300 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-lg font-bold font-mono tabular-nums leading-none">{m.score}</span>
                      <span className="text-[9px] font-semibold uppercase tracking-tight">Match</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">{m.id}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] uppercase font-semibold text-slate-500 capitalize">
                          Status: {m.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        Claim {m.lost_report?.case_reference || m.lost_report_id} &harr; Custody {m.found_report?.case_reference || m.found_report_id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAiAnalysis(m.id)}
                      disabled={analyzingMatchId === m.id}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${analyzingMatchId === m.id ? 'animate-spin' : ''}`} />
                      <span>{analyzingMatchId === m.id ? 'Analyzing...' : 'Analyze with Gemini AI'}</span>
                    </button>

                    {m.status !== 'rejected' && m.status !== 'verified' && (
                      <>
                        <button
                          onClick={() => setSelectedMatchForVerification(m)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-xs"
                        >
                          Request Verification
                        </button>
                        <button
                          onClick={() => setSelectedMatchForRejection(m)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Case Pair Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg text-xs">
                  {/* Lost Side */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900">
                      <Plane className="w-3.5 h-3.5 text-blue-600" />
                      <span>Reported Lost (Passenger Claim)</span>
                    </div>
                    <p className="text-slate-800">
                      <strong>Flight:</strong> {m.lost_report?.flight_number || 'N/A'} ({m.lost_report?.route || 'Route'})
                    </p>
                    <p className="text-slate-700 capitalize">
                      <strong>Spec:</strong> {m.lost_report?.color} {m.lost_report?.bag_category?.replace(/_/g, ' ')}
                      {m.lost_report?.brand ? ` · Brand: ${m.lost_report?.brand}` : ''}
                    </p>
                    <p className="text-slate-500">Travel Date: {m.lost_report?.travel_date}</p>
                  </div>

                  {/* Found Side */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-teal-900">
                      <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                      <span>Reported Found (Airport Custody)</span>
                    </div>
                    <p className="text-slate-800">
                      <strong>Location:</strong> {m.found_report?.airport} - {m.found_report?.terminal_area}
                    </p>
                    <p className="text-slate-700 capitalize">
                      <strong>Spec:</strong> {m.found_report?.color} {m.found_report?.bag_category?.replace(/_/g, ' ')}
                      {m.found_report?.brand ? ` · Brand: ${m.found_report?.brand}` : ''}
                    </p>
                    <p className="text-slate-500">Found Date: {m.found_report?.found_date}</p>
                  </div>
                </div>

                {/* Match Factors Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 text-xs">
                  {/* Matching factors */}
                  <div className="p-3 bg-teal-50/60 border border-teal-200/70 rounded-md">
                    <div className="flex items-center gap-1 font-semibold text-teal-900 mb-1">
                      <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                      <span>Matching Attributes ({m.matching_factors.length})</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                      {m.matching_factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Conflicting factors */}
                  <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-md">
                    <div className="flex items-center gap-1 font-semibold text-rose-900 mb-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Conflicting Attributes ({m.conflicting_factors.length})</span>
                    </div>
                    {m.conflicting_factors.length === 0 ? (
                      <p className="text-slate-500 text-[11px] italic">No direct attribute conflicts</p>
                    ) : (
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                        {m.conflicting_factors.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Missing factors */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Unspecified Data ({m.missing_factors.length})</span>
                    </div>
                    {m.missing_factors.length === 0 ? (
                      <p className="text-slate-500 text-[11px] italic">Complete specification</p>
                    ) : (
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
                        {m.missing_factors.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Operations & AI Explanation Box */}
                <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-md text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-950 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Operations & AI Matching Analysis:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-sans">{m.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Dispatch Modal */}
      {selectedMatchForVerification && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMatchForVerification(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden cursor-default">
            <div className="bg-[#0B192C] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-blue-300">Custody Verification</span>
                <h3 className="text-base font-bold text-white mt-0.5">Request Ownership Verification</h3>
              </div>
              <button
                onClick={() => setSelectedMatchForVerification(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendVerification} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Dispatch specific questions to the passenger. Once the passenger responds, authorized airport personnel can confirm custody and coordinate recovery.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Verification Questions (Dispatched to Passenger)
                </label>
                <div className="space-y-2">
                  {verificationQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={q}
                        onChange={(e) => {
                          const updated = [...verificationQuestions];
                          updated[idx] = e.target.value;
                          setVerificationQuestions(updated);
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      />
                      {verificationQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setVerificationQuestions(verificationQuestions.filter((_, i) => i !== idx))
                          }
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationQuestions([...verificationQuestions, ''])}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  + Add another question
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMatchForVerification(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchingVerification}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{dispatchingVerification ? 'Dispatching...' : 'Send to Passenger'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedMatchForRejection && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMatchForRejection(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden cursor-default">
            <div className="bg-[#0B192C] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Disqualify Match Candidate</h3>
              <button onClick={() => setSelectedMatchForRejection(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRejection} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Please provide the operational reason for disqualifying candidate match {selectedMatchForRejection.id}:
              </p>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMatchForRejection(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchingRejection}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs disabled:opacity-50"
                >
                  {dispatchingRejection ? 'Rejecting...' : 'Confirm Disqualification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
