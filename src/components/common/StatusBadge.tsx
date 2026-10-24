import React from 'react';
import { LostReportStatus, FoundReportStatus, MatchStatus, VerificationStatus } from '../../types';

interface StatusBadgeProps {
  status: LostReportStatus | FoundReportStatus | MatchStatus | VerificationStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'submitted':
      case 'logged':
        return {
          label: 'Reported',
          colorClass: 'text-slate-700 bg-slate-100 border-slate-200',
        };
      case 'under_review':
        return {
          label: 'Under Staff Review',
          colorClass: 'text-sky-800 bg-sky-50 border-sky-200',
        };
      case 'potential_match_found':
      case 'potential':
        return {
          label: 'Potential Match',
          colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
        };
      case 'verification_pending':
      case 'pending_passenger':
        return {
          label: 'Verification Pending',
          colorClass: 'text-indigo-800 bg-indigo-50 border-indigo-200',
        };
      case 'response_submitted':
        return {
          label: 'Passenger Responded',
          colorClass: 'text-cyan-800 bg-cyan-50 border-cyan-200',
        };
      case 'ownership_verified':
      case 'verified':
      case 'accepted':
        return {
          label: 'Ownership Verified',
          colorClass: 'text-teal-800 bg-teal-50 border-teal-200',
        };
      case 'recovery_arranged':
        return {
          label: 'Handover Ready',
          colorClass: 'text-blue-800 bg-blue-50 border-blue-200',
        };
      case 'recovered_and_closed':
      case 'released_to_owner':
      case 'completed':
        return {
          label: 'Recovered & Closed',
          colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200',
        };
      case 'rejected':
      case 'closed_unrecovered':
      case 'closed':
        return {
          label: 'Closed / Inconclusive',
          colorClass: 'text-rose-800 bg-rose-50 border-rose-200',
        };
      default:
        return {
          label: status.replace(/_/g, ' '),
          colorClass: 'text-slate-700 bg-slate-100 border-slate-200',
        };
    }
  };

  const { label, colorClass } = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold tracking-wide border whitespace-nowrap ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
};
