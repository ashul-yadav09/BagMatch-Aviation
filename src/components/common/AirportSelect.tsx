import React, { useState, useRef, useEffect } from 'react';
import { AIRPORTS, Airport } from '../../data/airports';
import { Plane, Search, ChevronDown, Check, X } from 'lucide-react';

interface AirportSelectProps {
  label: string;
  value: string;
  onChange: (code: string) => void;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
}

export const AirportSelect: React.FC<AirportSelectProps> = ({
  label,
  value,
  onChange,
  required = false,
  placeholder = 'Select or search airport...',
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find currently selected airport
  const selectedAirport = AIRPORTS.find((a) => a.code.toUpperCase() === (value || '').toUpperCase());

  // Filter airports based on search term
  const filteredAirports = AIRPORTS.filter((a) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      a.code.toLowerCase().includes(term) ||
      a.name.toLowerCase().includes(term) ||
      a.city.toLowerCase().includes(term) ||
      a.country.toLowerCase().includes(term)
    );
  });

  // Group filtered airports by region
  const groupedAirports = filteredAirports.reduce((acc, airport) => {
    if (!acc[airport.region]) {
      acc[airport.region] = [];
    }
    acc[airport.region].push(airport);
    return acc;
  }, {} as Record<string, Airport[]>);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCustomInput = (customValue: string) => {
    const code = customValue.toUpperCase().trim().slice(0, 4);
    onChange(code);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-3 py-2 text-sm border border-slate-300 rounded-md bg-white hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-colors flex items-center justify-between gap-2 shadow-xs"
      >
        <div className="flex items-center gap-2 truncate">
          <Plane className="w-3.5 h-3.5 text-blue-600 shrink-0 transform -rotate-45" />
          {selectedAirport ? (
            <span className="truncate text-slate-900 font-medium">
              <strong className="font-mono text-blue-700 font-bold">{selectedAirport.code}</strong> — {selectedAirport.city} ({selectedAirport.name})
            </span>
          ) : value ? (
            <span className="truncate text-slate-900 font-mono font-bold">
              {value} (Custom Airport)
            </span>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {helperText && <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-80 flex flex-col">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              placeholder="Search by city, airport name, or IATA code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden py-1"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Airport List */}
          <div className="overflow-y-auto p-1 divide-y divide-slate-100">
            {Object.keys(groupedAirports).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                <p>No listed airport found for "{searchTerm}".</p>
                {searchTerm.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => handleCustomInput(searchTerm)}
                    className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100"
                  >
                    Use "{searchTerm.toUpperCase()}" as Airport Code
                  </button>
                )}
              </div>
            ) : (
              Object.entries(groupedAirports).map(([region, airports]) => (
                <div key={region} className="py-1">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50/80 sticky top-0">
                    {region}
                  </div>
                  {airports.map((airport) => {
                    const isSelected = value.toUpperCase() === airport.code.toUpperCase();
                    return (
                      <button
                        key={airport.code}
                        type="button"
                        onClick={() => handleSelect(airport.code)}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-slate-100 flex items-center justify-between gap-2 transition-colors ${
                          isSelected ? 'bg-blue-50 font-semibold text-blue-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600">{airport.code}</span>
                            <span className="font-medium text-slate-900 truncate">{airport.city}, {airport.country}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{airport.name}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
