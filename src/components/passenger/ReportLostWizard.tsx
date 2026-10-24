import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BagCategory, BagSize, LostReport } from '../../types';
import { CheckCircle2, ArrowRight, ArrowLeft, Plane, Luggage, ShieldAlert } from 'lucide-react';
import { AirportSelect } from '../common/AirportSelect';
import { AIRPORTS } from '../../data/airports';

interface ReportLostWizardProps {
  onReportSubmitted: (report: LostReport) => void;
  onCancel: () => void;
  onOpenAuth: () => void;
}

export const ReportLostWizard: React.FC<ReportLostWizardProps> = ({
  onReportSubmitted,
  onCancel,
  onOpenAuth,
}) => {
  const { user, quickLogin } = useAuth();

  // Multi-step: Step 1 (Flight & Location), Step 2 (Bag Specifications), Step 3 (Review & Confirm)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [flightNumber, setFlightNumber] = useState('');
  const [travelDate, setTravelDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [departureAirport, setDepartureAirport] = useState('');
  const [arrivalAirport, setArrivalAirport] = useState('');
  const [lastKnownLocation, setLastKnownLocation] = useState('');

  const [bagCategory, setBagCategory] = useState<BagCategory>('suitcases_hard');
  const [color, setColor] = useState('Black');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [size, setSize] = useState<BagSize>('medium');
  const [brand, setBrand] = useState('');
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<LostReport | null>(null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4">
          <Plane className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to Submit a Lost Luggage Report</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          An account allows airport operations to verify your passenger identity, update your case status, and securely coordinate item return.
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
            className="px-5 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
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

  // Confirmation screen
  if (createdReport) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-xl border border-slate-200 shadow-md text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Case Created Successfully</span>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Lost Baggage Report Filed</h2>
        <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-md mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Your Case Reference</p>
          <p className="text-2xl font-mono font-bold text-blue-600 tracking-wider mt-1">{createdReport.case_reference}</p>
          <p className="text-xs text-slate-600 mt-2">
            Status: <span className="font-semibold text-slate-900 capitalize">{createdReport.status.replace(/_/g, ' ')}</span>
          </p>
        </div>
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Airport staff at <span className="font-semibold text-slate-800">{createdReport.arrival_airport}</span> have been notified. Our matching engine will continuously cross-reference incoming found baggage records.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => onReportSubmitted(createdReport)}
            className="px-6 py-2.5 bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            View Case Details & Timeline
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

  const validateStep1 = () => {
    if (!flightNumber.trim()) return 'Flight number is required.';
    if (!travelDate) return 'Travel date is required.';
    if (!departureAirport.trim()) return 'Departure airport code (e.g. JFK) is required.';
    if (!arrivalAirport.trim()) return 'Arrival airport code (e.g. SFO) is required.';
    return null;
  };

  const validateStep2 = () => {
    if (!bagCategory) return 'Bag category is required.';
    if (!color.trim()) return 'Primary color is required.';
    if (!description.trim()) return 'Brief description of the bag is required.';
    return null;
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        flight_number: flightNumber.toUpperCase().trim(),
        travel_date: travelDate,
        departure_airport: departureAirport.toUpperCase().trim(),
        arrival_airport: arrivalAirport.toUpperCase().trim(),
        last_known_location: lastKnownLocation.trim() || undefined,
        bag_category: bagCategory,
        color: color.trim(),
        secondary_color: secondaryColor.trim() || undefined,
        size,
        brand: brand.trim() || undefined,
        distinguishing_features: distinguishingFeatures.trim() || undefined,
        description: description.trim(),
        photo_url: photoUrl.trim() || undefined,
      };

      const res = await api.submitLostReport(payload);
      if (res.success && res.report) {
        setCreatedReport(res.report);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please review your entries.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-10 px-4">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
          <span>Lost Luggage Claim</span>
          <span>Step {currentStep} of 3</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-3 text-center text-xs font-medium text-slate-500 mt-2">
          <span className={currentStep >= 1 ? 'text-blue-600 font-semibold' : ''}>1. Flight & Route</span>
          <span className={currentStep >= 2 ? 'text-blue-600 font-semibold' : ''}>2. Luggage Specs</span>
          <span className={currentStep === 3 ? 'text-blue-600 font-semibold' : ''}>3. Review & Submit</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* STEP 1: Flight & Route Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Flight & Route Information</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your flight itinerary to help baggage handlers pinpoint the carousel or transit junction.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Flight Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UA482 or BA178"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Date of Travel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AirportSelect
                label="Departure Airport"
                required
                value={departureAirport}
                onChange={(code) => setDepartureAirport(code)}
                placeholder="Select departure airport..."
                helperText="Airport where you checked luggage or boarded"
              />

              <AirportSelect
                label="Arrival Airport"
                required
                value={arrivalAirport}
                onChange={(code) => setArrivalAirport(code)}
                placeholder="Select destination airport..."
                helperText="Final destination airport where bag was missed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Last Known Location <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Checked at counter 12, or carousel 4 baggage claim"
                value={lastKnownLocation}
                onChange={(e) => setLastKnownLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Bag Specifications */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Luggage Specifications</h2>
              <p className="text-xs text-slate-500 mt-1">
                Accurate physical details dramatically improve our automated and staff matching confidence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bagCategory}
                  onChange={(e) => setBagCategory(e.target.value as BagCategory)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
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
                  Primary Color <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Black, Navy Blue, Silver"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Approximate Size <span className="text-rose-500">*</span>
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as BagSize)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="small">Small (Cabin / Carry-on 20-22")</option>
                  <option value="medium">Medium (Check-in 24-26")</option>
                  <option value="large">Large (Check-in 28-30")</option>
                  <option value="oversized">Oversized / Heavy Cargo (31"+)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Brand / Manufacturer <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samsonite, Rimowa, Tumi, Away"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Secondary Color / Trim <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Red zipper, orange luggage tag"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Distinguishing Identifiers <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Yellow ribbon on top handle, scuff mark on rear left wheel, airline loyalty tag"
                value={distinguishingFeatures}
                onChange={(e) => setDistinguishingFeatures(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Provide any notable characteristics such as outer pockets, spinner wheel count, TSA lock status, or general condition..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Luggage Photo URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/bag-photo.jpg (or leave blank)"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Review and Confirm */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Review & Confirmation</h2>
              <p className="text-xs text-slate-500 mt-1">
                Please verify all entered details prior to filing this official case report.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Flight & Journey
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Flight:</span>
                    <p className="font-semibold text-slate-900 font-mono">{flightNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Date:</span>
                    <p className="font-semibold text-slate-900">{travelDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Route:</span>
                    <p className="font-semibold text-slate-900">
                      {departureAirport} {AIRPORTS.find(a => a.code.toUpperCase() === departureAirport.toUpperCase()) ? `(${AIRPORTS.find(a => a.code.toUpperCase() === departureAirport.toUpperCase())?.city})` : ''} &rarr;{' '}
                      {arrivalAirport} {AIRPORTS.find(a => a.code.toUpperCase() === arrivalAirport.toUpperCase()) ? `(${AIRPORTS.find(a => a.code.toUpperCase() === arrivalAirport.toUpperCase())?.city})` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Last Seen:</span>
                    <p className="font-semibold text-slate-900">{lastKnownLocation || 'Unspecified'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Luggage Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Category:</span>
                    <p className="font-semibold text-slate-900 capitalize">{bagCategory.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Color:</span>
                    <p className="font-semibold text-slate-900">{color} {secondaryColor ? `(${secondaryColor})` : ''}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Size:</span>
                    <p className="font-semibold text-slate-900 capitalize">{size}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Brand:</span>
                    <p className="font-semibold text-slate-900">{brand || 'Unspecified'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-xs">
                <span className="text-slate-500">Description:</span>
                <p className="font-medium text-slate-900 mt-0.5">{description}</p>
                {distinguishingFeatures && (
                  <p className="text-slate-600 mt-1">
                    <span className="font-semibold">Special markings:</span> {distinguishingFeatures}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              By submitting this report, you confirm that you are the lawful owner or authorized traveler associated with this baggage claim.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => (s - 1) as any)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0B192C] hover:bg-slate-800 rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Submitting Report...' : 'File Official Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
