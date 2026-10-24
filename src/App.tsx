import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { AuthModal } from './components/common/AuthModal';
import { PassengerHome } from './components/passenger/PassengerHome';
import { ReportLostWizard } from './components/passenger/ReportLostWizard';
import { ReportFoundForm } from './components/passenger/ReportFoundForm';
import { MyCasesView } from './components/passenger/MyCasesView';
import { CaseDetailModal } from './components/passenger/CaseDetailModal';
import { ProfileView } from './components/passenger/ProfileView';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { StaffReportsView } from './components/staff/StaffReportsView';
import { StaffMatchesView } from './components/staff/StaffMatchesView';
import { StaffRecoveryView } from './components/staff/StaffRecoveryView';
import { AdminConsole } from './components/admin/AdminConsole';
import { ShieldCheck, Plane } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [selectedCase, setSelectedCase] = useState<{ id: string; report_type: 'lost' | 'found' } | null>(null);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navbar adhering to Top Bar Contract */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <PassengerHome
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentView === 'report-lost' && (
          <ReportLostWizard
            onReportSubmitted={(report) => {
              setSelectedCase({ id: report.id, report_type: 'lost' });
              setCurrentView('my-cases');
            }}
            onCancel={() => handleNavigate('home')}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentView === 'report-found' && (
          <ReportFoundForm
            onReportSubmitted={() => {
              setCurrentView(user?.role === 'staff' || user?.role === 'admin' ? 'staff-reports' : 'my-cases');
            }}
            onCancel={() => handleNavigate('home')}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentView === 'my-cases' && (
          <MyCasesView
            onSelectCase={(item) => setSelectedCase(item)}
            onNavigate={handleNavigate}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentView === 'profile' && <ProfileView />}

        {/* Staff & Admin Views */}
        {currentView === 'staff-overview' && (
          <StaffDashboard onNavigateTab={handleNavigate} />
        )}

        {currentView === 'staff-reports' && <StaffReportsView />}

        {currentView === 'staff-matches' && <StaffMatchesView />}

        {currentView === 'staff-recovery' && <StaffRecoveryView />}

        {currentView === 'admin-console' && <AdminConsole />}
      </main>

      {/* Case Details Modal */}
      {selectedCase && (
        <CaseDetailModal
          caseId={selectedCase.id}
          reportType={selectedCase.report_type}
          onClose={() => setSelectedCase(null)}
          onRefreshList={() => {}}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Professional Aviation Footer */}
      <footer className="bg-[#0B192C] text-slate-400 text-xs border-t border-slate-800 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white">
                <Plane className="w-3.5 h-3.5 transform -rotate-45" />
              </div>
              <span className="font-extrabold text-white text-sm tracking-tight">BagMatch</span>
              <span className="text-slate-600" aria-hidden="true">|</span>
              <span className="text-[11px] text-slate-300">
                Aviation Lost-and-Found Baggage Recovery Platform
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>ICAO Annex 9 & IATA Resolution 753 Compliance</span>
              </span>
              <span className="text-slate-700" aria-hidden="true">·</span>
              <span>Encrypted Custody Verification</span>
              <span className="text-slate-700" aria-hidden="true">·</span>
              <span>Gemini 3.8 Flash AI Diagnostics</span>
            </div>

            <div className="text-[11px] text-slate-300">
              &copy; {new Date().getFullYear()} BagMatch Aero Systems. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
