import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BagCategory, BagSize, FoundReport } from '../../types';
import { CheckCircle2, Briefcase, ShieldAlert } from 'lucide-react';
import { AirportSelect } from '../common/AirportSelect';

interface ReportFoundFormProps {
  onReportSubmitted: (report: FoundReport) => void;
  onCancel: () => void;
  onOpenAuth: () => void;
}

export const ReportFoundForm: React.FC<ReportFoundFormProps> = ({
  onReportSubmitted,
  onCancel,
  onOpenAuth,
}) => {
  const { user, quickLogin } = useAuth();

  const [airport, setAirport] = useState('SFO');
  const [terminalArea, setTerminalArea] = useState('Terminal 2 - Central Concourse');
  const [foundDate, setFoundDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [foundTime, setFoundTime] = useState('14:30');
  const [foundLocation, setFoundLocation] = useState('');
  const [bagCategory, setBagCategory] = useState<BagCategory>('backpack');
  const [color, setColor] = useState('Navy Blue');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [size, setSize] = useState<BagSize>('medium');
  const [brand, setBrand] = useState('');
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Staff-only fields
  const [storageLocation, setStorageLocation] = useState('Locker Room A-04');
  const [staffNotes, setStaffNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<FoundReport | null>(null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mx-auto mb-4">
          <Briefcase className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to Report Found Baggage</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          To maintain airport security chain-of-custody, finders must be authenticated before logging items into the baggage handling database.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => onOpenAuth()}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B192C] hover:bg-slate-800 rounded-md transition-colors cursor-pointer shadow-xs"
          >
            Sign In / Register
          </button>
          <button
            type="button"
            onClick={() => quickLogin('passenger')}
            className="px-5 py-2.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors cursor-pointer"
          >
            Instant Demo Passenger (Emma Watson)
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (createdReport) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-xl border border-slate-200 shadow-md text-center">
        <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-teal-700">Custody Logged Successfully</span>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Found Luggage Logged</h2>
        <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-md mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Found Custody Reference</p>
          <p className="text-2xl font-mono font-bold text-teal-700 tracking-wider mt-1">{createdReport.case_reference}</p>
          <p className="text-xs text-slate-600 mt-2">
            Status: <span className="font-semibold text-slate-900 capitalize">{createdReport.status.replace(/_/g, ' ')}</span>
          </p>
        </div>
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Thank you. The item has been placed in the secure staff review queue at <span className="font-semibold text-slate-800">{createdReport.airport}</span>. For traveler security and privacy, owner details are held exclusively by authorized airline personnel.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => onReportSubmitted(createdReport)}
            className="px-6 py-2.5 bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            View My Logged Cases
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!foundLocation.trim()) {
      setError('Please provide the exact location where the luggage was discovered.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a brief physical description.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        airport: airport.toUpperCase().trim(),
        terminal_area: terminalArea.trim(),
        found_date: foundDate,
        found_time: foundTime,
        found_location: foundLocation.trim(),
        bag_category: bagCategory,
        color: color.trim(),
        secondary_color: secondaryColor.trim() || undefined,
        size,
        brand: brand.trim() || undefined,
        distinguishing_features: distinguishingFeatures.trim() || undefined,
        description: description.trim(),
        photo_url: photoUrl.trim() || undefined,
        storage_location: user.role === 'staff' ? storageLocation : undefined,
        staff_notes: user.role === 'staff' ? staffNotes : undefined,
      };

      const res = await api.submitFoundReport(payload);
      if (res.success && res.report) {
        setCreatedReport(res.report);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit found luggage report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-10 px-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-700">Airport Custody Intake</span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Report Unattended / Found Luggage</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Record baggage discovered within airport terminal, gate, or carousel precincts for authorized inspection.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location & Time */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Location & Time Found</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AirportSelect
                label="Custody Airport"
                value={airport}
                onChange={(code) => setAirport(code)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Terminal / Area <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Terminal 3, Gate B22 or Carousel 5"
                  value={terminalArea}
                  onChange={(e) => setTerminalArea(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Date Found <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={foundDate}
                  onChange={(e) => setFoundDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Approximate Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={foundTime}
                  onChange={(e) => setFoundTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Specific Discovery Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Left unattended beside seating row 14 near boarding gate B28"
                value={foundLocation}
                onChange={(e) => setFoundLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Luggage Details */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Luggage Characteristics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bagCategory}
                  onChange={(e) => setBagCategory(e.target.value as BagCategory)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                >
                  <option value="suitcases_hard">Hard-shell Suitcase</option>
                  <option value="suitcases_soft">Soft-side Suitcase</option>
                  <option value="backpack">Backpack / Rucksack</option>
                  <option value="duffel">Duffel / Holdall Bag</option>
                  <option value="tote_handbag">Tote / Handbag</option>
                  <option value="briefcase_laptop">Briefcase / Laptop Case</option>
                  <option value="garment_bag">Garment Bag</option>
                  <option value="sports_specialty">Sports / Specialty Equipment</option>
                  <option value="other">Other Luggage Type</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Dominant Color <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navy Blue, Grey, Red"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Size Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as BagSize)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                >
                  <option value="small">Small (Cabin / Carry-on)</option>
                  <option value="medium">Medium (Standard Check-in)</option>
                  <option value="large">Large (Full Check-in)</option>
                  <option value="oversized">Oversized / Heavy</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Brand, if visible <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samsonite, Rimowa, SwissGear"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Distinguishing Features <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TSA lock intact, blue keytag, scuffed corners"
                  value={distinguishingFeatures}
                  onChange={(e) => setDistinguishingFeatures(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Visual Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe zipper configuration, visible badges, surface texture..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Staff Specific Fields */}
          {user.role === 'staff' && (
            <div className="bg-blue-50/60 p-4 rounded-lg border border-blue-200 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-900">
                Authorized Staff Custody Controls
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">
                    Internal Storage / Locker Location
                  </label>
                  <input
                    type="text"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-blue-200 bg-white rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">
                    Staff Internal Notes
                  </label>
                  <input
                    type="text"
                    value={staffNotes}
                    onChange={(e) => setStaffNotes(e.target.value)}
                    placeholder="e.g. Scanned by security unit. Stored in vault."
                    className="w-full px-3 py-2 text-sm border border-blue-200 bg-white rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Registering Intake...' : 'Submit Found Baggage Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
