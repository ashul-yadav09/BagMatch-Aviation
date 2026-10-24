import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { VerificationRequest, LostReport, RecoveryRecord } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  MapPin,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

export const StaffRecoveryView: React.FC = () => {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [readyForRecovery, setReadyForRecovery] = useState<LostReport[]>([]);
  const [completedRecoveries, setCompletedRecoveries] = useState<RecoveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review passenger response modal
  const [selectedVerifForDecision, setSelectedVerifForDecision] = useState<VerificationRequest | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [deciding, setDeciding] = useState(false);

  // Complete recovery modal
  const [selectedCaseForRecovery, setSelectedCaseForRecovery] = useState<LostReport | null>(null);
  const [handoverAirport, setHandoverAirport] = useState('SFO');
  const [handoverLocation, setHandoverLocation] = useState('Terminal 3 - Central Baggage Counter (Carousel 4)');
  const [idTypeVerified, setIdTypeVerified] = useState('Passport');
  const [idReferenceMasked, setIdReferenceMasked] = useState('USA-***9812');
  const [recipientName, setRecipientName] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [completingRecovery, setCompletingRecovery] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [verifRes, reportsRes, recoveryRes] = await Promise.all([
        api.getVerifications(),
        api.getStaffReports({ type: 'lost' }),
        api.getDashboardStats(),
      ]);

      if (verifRes.success) {
        setVerifications(verifRes.verifications || []);
      }

      if (reportsRes.success) {
        // Filter for verified / ready for recovery cases
        const verifiedCases = (reportsRes.lostReports || []).filter(
          (l) => l.status === 'ownership_verified' || l.status === 'recovery_arranged'
        );
        setReadyForRecovery(verifiedCases);
      }

      const recRes = await api.getRecoveries();
      if (recRes.success) {
        setCompletedRecoveries(recRes.records || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load recovery data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleDecision = async (decision: 'verified' | 'rejected') => {
    if (!selectedVerifForDecision) return;
    setDeciding(true);
    setError(null);

    try {
      const res = await api.decideVerification(selectedVerifForDecision.id, decision, decisionNotes);
      if (res.success) {
        setSelectedVerifForDecision(null);
        setDecisionNotes('');
        loadAll();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record decision.');
    } finally {
      setDeciding(false);
    }
  };

  const handleCompleteRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForRecovery) return;
    setCompletingRecovery(true);
    setError(null);

    try {
      const res = await api.completeRecovery({
        lost_report_id: selectedCaseForRecovery.id,
        found_report_id: selectedCaseForRecovery.id, // linked found report ID
        handover_airport: handoverAirport,
        handover_location: handoverLocation,
        id_type_verified: idTypeVerified,
        id_reference_masked: idReferenceMasked,
        pickup_authorized_name: recipientName || selectedCaseForRecovery.passenger_name,
        staff_notes: handoverNotes,
      });

      if (res.success) {
        setSelectedCaseForRecovery(null);
        loadAll();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete recovery handover.');
    } finally {
      setCompletingRecovery(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-700">Custody Handover</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Verification & Baggage Release
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforce the 8-stage chain-of-custody protocol: evaluate passenger identifying responses and execute authorized releases.
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-md transition-colors self-start md:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-md border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Ownership Verification Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              1. Passenger Verification Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review answers to security questions before confirming ownership.
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono">
            {verifications.length} Active Requests
          </span>
        </div>

        {verifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No active verification requests pending passenger response.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {verifications.map((v) => {
              const hasResponse = !!v.passenger_response;

              return (
                <div key={v.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{v.lost_case_reference || v.id}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-slate-700">Passenger: {v.passenger_name || 'Passenger'}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">Flight: {v.flight_number || 'UA482'}</span>
                    </div>

                    <div className="mt-2 text-slate-600">
                      <span className="font-semibold text-slate-700">Dispatched Questions:</span>{' '}
                      {v.questions.join('; ')}
                    </div>

                    {hasResponse ? (
                      <div className="mt-2 p-2.5 bg-indigo-50/70 border border-indigo-200 rounded text-slate-800">
                        <span className="font-semibold text-indigo-950">Passenger Answer:</span> "
                        {v.passenger_response}"
                      </div>
                    ) : (
                      <div className="mt-2 text-amber-700 text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting passenger reply in passenger case portal</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={v.status} />

                    {v.status === 'response_submitted' && (
                      <button
                        onClick={() => {
                          setSelectedVerifForDecision(v);
                          setDecisionNotes('');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-xs"
                      >
                        Evaluate Response
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Ready for Handover Coordination */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              2. Verified Cases Ready for Release & Handover
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ownership has been verified. Coordinate counter location or execute final release.
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-mono">
            {readyForRecovery.length} Ready
          </span>
        </div>

        {readyForRecovery.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No verified cases currently awaiting handover.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {readyForRecovery.map((c) => (
              <div key={c.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{c.case_reference}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-semibold text-slate-800">{c.passenger_name}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600 font-mono">{c.flight_number}</span>
                  </div>
                  <p className="text-slate-600 capitalize">
                    {c.color} {c.bag_category.replace(/_/g, ' ')} {c.brand ? `(${c.brand})` : ''} · Arrival at {c.arrival_airport}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={c.status} />
                  <button
                    onClick={() => {
                      setSelectedCaseForRecovery(c);
                      setRecipientName(c.passenger_name);
                      setHandoverAirport(c.arrival_airport || 'SFO');
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Execute Recovery Handover</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Completed Recovery History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            3. Immutable Handover Records ({completedRecoveries.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chain-of-custody audit log of released luggage with verifying officer credentials.
          </p>
        </div>

        {completedRecoveries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No completed recoveries logged in system yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Case Reference</th>
                  <th className="py-3 px-4">Recipient Name</th>
                  <th className="py-3 px-4">Airport & Counter</th>
                  <th className="py-3 px-4">ID Verification</th>
                  <th className="py-3 px-4">Staff Officer</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {completedRecoveries.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.case_reference}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{rec.passenger_name || rec.pickup_authorized_name}</td>
                    <td className="py-3 px-4">
                      {rec.handover_airport} ({rec.handover_location})
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {rec.id_type_verified} · {rec.id_reference_masked}
                    </td>
                    <td className="py-3 px-4">{rec.verified_by_name}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                      {new Date(rec.completed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evaluate Response Modal */}
      {selectedVerifForDecision && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-[#0B192C] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-blue-300">Custody Evaluation</span>
                <h3 className="text-base font-bold text-white mt-0.5">Evaluate Passenger Response</h3>
              </div>
              <button
                onClick={() => setSelectedVerifForDecision(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  Questions Dispatched:
                </span>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-700">
                  {selectedVerifForDecision.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                <span className="font-semibold text-indigo-950 uppercase tracking-wider text-[10px] block mb-1">
                  Passenger Submitted Answer:
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  "{selectedVerifForDecision.passenger_response}"
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                  Officer Decision Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lock combination 742 opened bag successfully; contents confirmed."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={deciding}
                  onClick={() => handleDecision('rejected')}
                  className="px-4 py-2 font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                >
                  Reject Verification
                </button>
                <button
                  type="button"
                  disabled={deciding}
                  onClick={() => handleDecision('verified')}
                  className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Ownership Verified</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Recovery Modal */}
      {selectedCaseForRecovery && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCaseForRecovery(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden cursor-default">
            <div className="bg-[#0B192C] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-teal-300">Final Custody Release</span>
                <h3 className="text-base font-bold text-white mt-0.5">Record Verified Recovery Handover</h3>
              </div>
              <button onClick={() => setSelectedCaseForRecovery(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteRecovery} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                You are authorizing the release of case <strong className="font-mono">{selectedCaseForRecovery.case_reference}</strong>.
                Verify passenger credentials in-person prior to submission.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                    Handover Airport <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={handoverAirport}
                    onChange={(e) => setHandoverAirport(e.target.value.toUpperCase())}
                    className="w-full p-2 border border-slate-300 rounded-md uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                    Identity Document Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={idTypeVerified}
                    onChange={(e) => setIdTypeVerified(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="Passport">Passport</option>
                    <option value="National ID Card">National ID Card</option>
                    <option value="Driver's License">Driver's License</option>
                    <option value="Original Airline Boarding Pass">Original Airline Boarding Pass</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                  Handover Desk / Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={handoverLocation}
                  onChange={(e) => setHandoverLocation(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                    Recipient Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                    Masked ID Reference
                  </label>
                  <input
                    type="text"
                    value={idReferenceMasked}
                    onChange={(e) => setIdReferenceMasked(e.target.value)}
                    placeholder="e.g. USA-***1234"
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                  Officer Handover Signature & Notes
                </label>
                <input
                  type="text"
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="e.g. Physical receipt signed. Passenger confirmed all internal belongings intact."
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForRecovery(null)}
                  className="px-4 py-2 text-slate-600 border border-slate-200 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completingRecovery}
                  className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>{completingRecovery ? 'Recording...' : 'Close Case & Complete Handover'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
