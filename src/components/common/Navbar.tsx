import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plane, LogOut, User as UserIcon, Menu, X, ShieldCheck } from 'lucide-react';
import { UserRole } from '../../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const { user, logout, quickLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isStaffOrAdmin = user && (user.role === 'staff' || user.role === 'admin');

  const navigateAndClose = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B192C] text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single text element Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateAndClose(isStaffOrAdmin ? 'staff-overview' : 'home')}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group cursor-pointer"
            >
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-500 transition-colors">
                <Plane className="w-4 h-4 transform -rotate-45" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
                  BagMatch
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] tracking-widest uppercase font-semibold text-blue-300/80">
                  Aviation Recovery
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-5 concise single-line nav links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider font-semibold">
            {!isStaffOrAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => navigateAndClose('home')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
                    currentView === 'home' ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-slate-300'
                  }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('report-lost')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
                    currentView === 'report-lost' ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-slate-300'
                  }`}
                >
                  Report Lost
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('report-found')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
                    currentView === 'report-found' ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-slate-300'
                  }`}
                >
                  Report Found
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('my-cases')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
                    currentView === 'my-cases' ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-slate-300'
                  }`}
                >
                  My Cases
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose('profile')}
                    className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
                      currentView === 'profile' ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-slate-300'
                    }`}
                  >
                    Profile
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigateAndClose('staff-overview')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
                    currentView === 'staff-overview' ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-slate-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('staff-reports')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
                    currentView === 'staff-reports' ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-slate-300'
                  }`}
                >
                  Reports Directory
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('staff-matches')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
                    currentView === 'staff-matches' ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-slate-300'
                  }`}
                >
                  Potential Matches
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('staff-recovery')}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
                    currentView === 'staff-recovery' ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-slate-300'
                  }`}
                >
                  Verification & Recovery
                </button>
                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose('admin-console')}
                    className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
                      currentView === 'admin-console' ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-amber-300'
                    }`}
                  >
                    Admin Console
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Zone 3: Actions + Quick Role Pill + Mobile Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Demo Switcher dropdown/pills */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-md p-0.5 text-[11px]">
              <span className="px-1.5 text-slate-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                Role:
              </span>
              <button
                type="button"
                onClick={() => quickLogin('passenger')}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  user?.role === 'passenger' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Passenger
              </button>
              <button
                type="button"
                onClick={() => quickLogin('staff')}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  user?.role === 'staff' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => quickLogin('admin')}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  user?.role === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-blue-300 uppercase tracking-widest font-mono">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors whitespace-nowrap shrink-0 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0F2038] border-b border-slate-700 px-4 pt-3 pb-5 space-y-3">
          {/* Quick Role Switcher for Mobile */}
          <div className="p-2 bg-slate-900/80 rounded-md border border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Demo Role:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  quickLogin('passenger');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                Passenger
              </button>
              <button
                type="button"
                onClick={() => {
                  quickLogin('staff');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 text-xs bg-blue-900 hover:bg-blue-800 rounded text-blue-200 font-semibold"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => {
                  quickLogin('admin');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-amber-300"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 text-sm font-medium">
            {!isStaffOrAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => navigateAndClose('home')}
                  className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                    currentView === 'home' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('report-lost')}
                  className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                    currentView === 'report-lost' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Report Lost Bag
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('report-found')}
                  className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                    currentView === 'report-found' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Report Found Bag
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('my-cases')}
                  className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                    currentView === 'my-cases' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  My Cases
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose('profile')}
                    className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                      currentView === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    Profile
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigateAndClose('staff-overview')}
                  className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                    currentView === 'staff-overview' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Operations Overview
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('staff-reports')}
                  className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                    currentView === 'staff-reports' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Reports Directory
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('staff-matches')}
                  className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                    currentView === 'staff-matches' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Potential Matches
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('staff-recovery')}
                  className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                    currentView === 'staff-recovery' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Verification & Recovery Handover
                </button>
                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose('admin-console')}
                    className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                      currentView === 'admin-console' ? 'bg-blue-600 text-white' : 'text-amber-300 hover:bg-slate-800'
                    }`}
                  >
                    Admin Console
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
