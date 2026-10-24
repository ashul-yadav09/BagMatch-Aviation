import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LostReport, FoundReport, CaseEvent, VerificationRequest, RecoveryRecord } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CaseTimeline } from '../common/CaseTimeline';
import { X, Plane, Briefcase, RefreshCw, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CaseDetailModalProps {
  caseId: string;
  reportType: 'lost' | 'found';
  onClose: () => void;
  onRefreshList?: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseId,
  reportType,
  onClose,
  onRefreshList,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lostReport, setLostReport] = useState<LostReport | null>(null);
  const [foundReport, setFoundReport] = useState<FoundReport | null>(null);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [verification, setVerification] = useState<VerificationRequest | null>(null);
  const [recovery, setRecovery] = useState<RecoveryRecord | null>(null);

  // Passenger response form
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationSuccessMessage, setVerificationSuccessMessage] = useState<string | null>(null);

  const loadCaseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      if (reportType === 'lost') {
        const res = await api.getLostReport(caseId);
        if (res.success) {
          setLostReport(res.report);
          setEvents(res.events || []);
          setMatches(res.matches || []);
          setVerification(res.verification || null);
          setRecovery(res.recovery || null);
        }
      } else {
        const res = await api.getFoundReport(caseId);
        if (res.success) {
          setFoundReport(res.report);
          setEvents(res.events || []);
          setMatches(res.matches || []);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load case record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseDetails();
  }, [caseId, reportType]);

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verification) return;
    if (!verificationAnswer.trim() || verificationAnswer.trim().length < 5) {
      setError('Please provide a complete verification response.');
      return;
    }

    setSubmittingVerification(true);
    setError(null);
    try {
      const res = await api.submitVerificationResponse(verification.id, verificationAnswer.trim());
      if (res.success) {
        setVerification(res.verification);
        setVerificationSuccessMessage('Verification details dispatched to airline operations team.');
        loadCaseDetails();
        if (onRefreshList) onRefreshList();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit response.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const caseRef = lostReport?.case_reference || foundReport?.case_reference || caseId;
  const currentStatus = lostReport?.status || foundReport?.status || 'under_review';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 cursor-pointer"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6 cursor-default">
        {/* Header */}
        <div className="bg-[#0B192C] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
              {reportType === 'lost' ? <Plane className="w-4 h-4 text-blue-300" /> : <Briefcase className="w-4 h-4 text-teal-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-wider uppercase text-blue-300">
                  Case File: {caseRef}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-[11px] uppercase tracking-wider text-slate-300">
                  {reportType === 'lost' ? 'Passenger Lost Luggage Claim' : 'Found Luggage Intake'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {reportType === 'lost'
                  ? `${lostReport?.color || ''} ${lostReport?.bag_category?.replace(/_/g, ' ') || 'Luggage'} (Flight ${lostReport?.flight_number || ''})`
                  : `${foundReport?.color || ''} ${foundReport?.bag_category?.replace(/_/g, ' ') || 'Baggage'} (${foundReport?.airport || ''})`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <span>Retrieving authenticated case timeline...</span>
            </div>
          ) : error && !lostReport && !foundReport ? (
            <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
              {error}
            </div>
          ) : (
            <>
              {/* Status Header Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Status:</span>
                  <StatusBadge status={currentStatus} />
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  Updated: {new Date(lostReport?.updated_at || foundReport?.updated_at || '').toLocaleString()}
                </div>
              </div>

              {/* Luggage Details Summary */}
              {lostReport && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-slate-200 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Flight Itinerary</span>
                    <p className="font-semibold text-slate-900 font-mono mt-0.5">{lostReport.flight_number}</p>
                    <p className="text-slate-600">{lostReport.departure_airport} &rarr; {lostReport.arrival_airport}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Luggage Spec</span>
                    <p className="font-semibold text-slate-900 mt-0.5 capitalize">{lostReport.color} {lostReport.bag_category.replace(/_/g, ' ')}</p>
                    <p className="text-slate-600">Size: {lostReport.size}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Brand & Features</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{lostReport.brand || 'Unbranded'}</p>
                    <p className="text-slate-600 truncate">{lostReport.distinguishing_features || 'No markings noted'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Reported By</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{lostReport.passenger_name}</p>
                    <p className="text-slate-600 font-mono">{lostReport.travel_date}</p>
                  </div>
                </div>
              )}

              {foundReport && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-slate-200 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Intake Airport</span>
                    <p className="font-semibold text-slate-900 font-mono mt-0.5">{foundReport.airport}</p>
                    <p className="text-slate-600">{foundReport.terminal_area}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Luggage Spec</span>
                    <p className="font-semibold text-slate-900 mt-0.5 capitalize">{foundReport.color} {foundReport.bag_category.replace(/_/g, ' ')}</p>
                    <p className="text-slate-600">Size: {foundReport.size}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Brand</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{foundReport.brand || 'Unbranded'}</p>
                    <p className="text-slate-600 truncate">{foundReport.distinguishing_features || 'None noted'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Date Discovered</span>
                    <p className="font-semibold text-slate-900 mt-0.5 font-mono">{foundReport.found_date}</p>
                    <p className="text-slate-600 font-mono">{foundReport.found_time}</p>
                  </div>
                </div>
              )}

              {/* Ownership Verification Request Card (if present) */}
              {verification && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-700" />
                    <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wider">
                      Ownership Verification Protocol
                    </h3>
                  </div>

                  <p className="text-xs text-indigo-900 leading-relaxed">
                    Airport operations staff member <span className="font-semibold">{verification.requested_by_name}</span> has requested private identifying verification to confirm custody before releasing this item.
                  </p>

                  <div className="my-3 p-3 bg-white rounded-lg border border-indigo-100 text-xs space-y-1.5">
                    <p className="font-semibold text-slate-800 uppercase tracking-wide text-[11px]">Staff Questions:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      {verification.questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>

                  {verification.status === 'pending_passenger' ? (
                    <form onSubmit={handleVerificationSubmit} className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-indigo-950 mb-1">
                          Your Private Verification Response:
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={verificationAnswer}
                          onChange={(e) => setVerificationAnswer(e.target.value)}
                          placeholder="e.g. The TSA lock code is 742. Inside the front zippered sleeve is a blue notebook and a silver pen..."
                          className="w-full p-2.5 text-xs bg-white border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Information is encrypted and only accessible to authorized airport verification officers.
                        </span>
                        <button
                          type="submit"
                          disabled={submittingVerification}
                          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{submittingVerification ? 'Submitting...' : 'Submit Verification Response'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-2 p-3 bg-white/80 rounded-md border border-indigo-200 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-indigo-950 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span>Your Verification Details Were Submitted</span>
                      </div>
                      <p className="text-slate-600 italic">"{verification.passenger_response}"</p>
                      {verification.status === 'verified' && (
                        <p className="mt-2 text-teal-700 font-semibold">
                          Staff verified your ownership. Handover ready!
                        </p>
                      )}
                    </div>
                  )}

                  {verificationSuccessMessage && (
                    <p className="mt-2 text-xs font-semibold text-teal-700">{verificationSuccessMessage}</p>
                  )}
                </div>
              )}

              {/* Handover & Recovery Milestone (if completed) */}
              {recovery && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
                      Official Recovery Handover Complete
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3">
                    <div>
                      <span className="text-emerald-800 font-medium">Handover Location:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{recovery.handover_airport} ({recovery.handover_location})</p>
                    </div>
                    <div>
                      <span className="text-emerald-800 font-medium">Recipient Verified:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{recovery.pickup_authorized_name}</p>
                      <p className="text-slate-600">ID: {recovery.id_type_verified}</p>
                    </div>
                    <div>
                      <span className="text-emerald-800 font-medium">Staff Officer:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{recovery.verified_by_name}</p>
                      <p className="text-slate-600 font-mono">{new Date(recovery.completed_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Potential Candidate Matches (for passenger's own lost bag) */}
              {reportType === 'lost' && matches.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                    Candidate Matches ({matches.length})
                  </h3>
                  <div className="space-y-3">
                    {matches.map((m: any) => (
                      <div key={m.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              Confidence: {m.score}%
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-xs text-slate-600 font-medium capitalize">
                              Status: {m.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                            {m.explanation}
                          </p>
                          {m.matching_factors && m.matching_factors.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-500">
                              <span>Corroborated markers:</span>
                              {m.matching_factors.map((f: string, i: number) => (
                                <span key={i} className="text-teal-700 font-medium">
                                  {f}{i < m.matching_factors.length - 1 ? ' · ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real Timeline Events */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-4">
                  Official Case Timeline
                </h3>
                <div className="bg-white p-5 border border-slate-200 rounded-xl">
                  <CaseTimeline events={events} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
