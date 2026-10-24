import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Compass, Briefcase, ShieldCheck, ArrowRight, Clock, FileCheck } from 'lucide-react';
import heroAirportImg from '../../assets/images/hero_airport_terminal_1792825287770.jpg';

interface PassengerHomeProps {
  onNavigate: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const PassengerHome: React.FC<PassengerHomeProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();

  const handleAction = (targetView: string) => {
    if (!user && targetView === 'my-cases') {
      onOpenAuth('login');
      return;
    }
    onNavigate(targetView);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-900 pb-16">
      {/* Optional faint low-opacity aircraft watermark in background */}
      <div
        className="pointer-events-none absolute right-0 top-16 w-96 h-96 opacity-[0.03] select-none overflow-hidden"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-slate-900">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </div>

      {/* Hero Section */}
      <div className="relative bg-[#0B192C] text-white overflow-hidden border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-widest mb-3">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Airport Baggage Tracking & Recovery</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Lost luggage recovered with airline precision.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                BagMatch connects airline passengers with airport baggage handling facilities worldwide. Submit your report in under two minutes, monitor real-time recovery milestones, and verify custody securely.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Secure Custody Verification</span>
                </div>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-400" />
                  <span>Multi-Airport Cross-Matching</span>
                </div>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Real-Time Case Timeline</span>
                </div>
              </div>
            </div>

            {/* Editorial Airport Visual */}
            <div className="lg:col-span-5">
              <div className="relative rounded-xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-900">
                <img
                  src={heroAirportImg}
                  alt="Airport international departures terminal"
                  referrerPolicy="no-referrer"
                  className="w-full h-64 sm:h-72 object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                  <div className="text-xs text-slate-200">
                    <p className="font-semibold text-white">Central Operations Hub</p>
                    <p className="text-[11px] text-slate-300">Synchronized with terminal baggage control stations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Primary Actions */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Action 1: I LOST MY BAG */}
          <button
            type="button"
            onClick={() => handleAction('report-lost')}
            className="w-full text-left group relative bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-md hover:shadow-lg hover:border-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                I LOST MY BAG
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
                File a structured claim with your flight number, luggage style, distinguishing identifiers, and last seen location.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700 w-full">
              <span>Start Lost Bag Report</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Action 2: I FOUND A BAG */}
          <button
            type="button"
            onClick={() => handleAction('report-found')}
            className="w-full text-left group relative bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-md hover:shadow-lg hover:border-teal-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Briefcase className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                I FOUND A BAG
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
                Log unattended luggage discovered in airport terminal or transit areas for authorized airport staff custody.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:text-teal-800 w-full">
              <span>Report Found Luggage</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Action 3: MY CASES */}
          <button
            type="button"
            onClick={() => handleAction('my-cases')}
            className="w-full text-left group relative bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-md hover:shadow-lg hover:border-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                MY CASES
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
                Review active case milestones, view potential candidate matches, and respond to staff ownership verification requests.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 w-full">
              <span>{user ? 'Track My Reports' : 'Sign In to View Cases'}</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Recovery Process Protocol */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Standard Operating Protocol</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">How BagMatch Coordinates Baggage Recovery</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <span className="text-xs font-mono font-bold text-blue-600">01.</span>
            <h4 className="font-semibold text-sm text-slate-900 mt-2">Report Submission</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Passenger or airport staff files case details with flight numbers, airport routes, and physical identifiers.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <span className="text-xs font-mono font-bold text-blue-600">02.</span>
            <h4 className="font-semibold text-sm text-slate-900 mt-2">Intelligent Matching</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              The platform compares categories, colors, brands, airport terminals, and dates with normalized scoring and AI assistance.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <span className="text-xs font-mono font-bold text-blue-600">03.</span>
            <h4 className="font-semibold text-sm text-slate-900 mt-2">Ownership Verification</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Staff reviews candidate matches and sends private security questions (e.g., lock code, internal items) to the passenger.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <span className="text-xs font-mono font-bold text-blue-600">04.</span>
            <h4 className="font-semibold text-sm text-slate-900 mt-2">Authorized Handover</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Staff verifies passenger credentials at the airport counter and logs an immutable recovery handover record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
