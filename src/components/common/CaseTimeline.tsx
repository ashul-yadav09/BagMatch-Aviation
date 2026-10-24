import React from 'react';
import { CaseEvent } from '../../types';
import { CheckCircle2, Clock, ShieldCheck, AlertCircle, FileText, ArrowRightCircle } from 'lucide-react';

interface CaseTimelineProps {
  events: CaseEvent[];
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm">
        No case events recorded yet. Updates will appear as staff reviews this report.
      </div>
    );
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'report_submitted':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'potential_match_identified':
      case 'match_reviewed':
        return <ArrowRightCircle className="w-4 h-4 text-amber-600" />;
      case 'verification_requested':
      case 'verification_response_received':
        return <Clock className="w-4 h-4 text-indigo-600" />;
      case 'ownership_verified':
        return <ShieldCheck className="w-4 h-4 text-teal-600" />;
      case 'recovered_and_closed':
      case 'case_closed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'ownership_rejected':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return { date: isoString, time: '' };
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, idx) => {
          const isLast = idx === events.length - 1;
          const { date, time } = formatDate(event.created_at);

          return (
            <li key={event.id || idx}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {getEventIcon(event.event_type)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                      <div className="text-right whitespace-nowrap text-xs text-slate-500 font-mono tabular-nums">
                        <span>{date}</span> {time && <span className="text-slate-400">· {time}</span>}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">{event.description}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                      <span>Logged by</span>
                      <span className="font-medium text-slate-600">{event.performed_by_name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="uppercase text-[10px] tracking-wider font-semibold text-slate-500">
                        {event.performed_by_role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
