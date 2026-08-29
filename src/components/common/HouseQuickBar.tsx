import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { Building2, ChevronLeft, ChevronRight, Activity, Egg, Bird } from 'lucide-react';

interface HouseQuickBarProps {
  selectedHouse: string;
  onSelectHouse: (house: string) => void;
  showAllOption?: boolean;
}

export const HouseQuickBar: React.FC<HouseQuickBarProps> = ({
  selectedHouse,
  onSelectHouse,
  showAllOption = true
}) => {
  const { flocks = [], getFlockStats } = useFarm();

  const safeFlocks = Array.isArray(flocks) ? flocks.filter(Boolean) : [];
  const houseOptions = safeFlocks.map(f => f.houseNumber).filter(Boolean);
  const currentIndex = houseOptions.indexOf(selectedHouse);

  const handlePrev = () => {
    if (houseOptions.length === 0) return;
    if (currentIndex <= 0) {
      onSelectHouse(houseOptions[houseOptions.length - 1]);
    } else {
      onSelectHouse(houseOptions[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (houseOptions.length === 0) return;
    if (currentIndex >= houseOptions.length - 1 || currentIndex === -1) {
      onSelectHouse(houseOptions[0]);
    } else {
      onSelectHouse(houseOptions[currentIndex + 1]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* House Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-200">
          <Building2 className="w-4 h-4 text-teal-600" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">House:</span>
        </div>

        {showAllOption && (
          <button
            onClick={() => onSelectHouse('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedHouse === 'All'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Houses
          </button>
        )}

        {safeFlocks.map((flock) => {
          if (!flock || !flock.houseNumber) return null;
          const isSelected = selectedHouse === flock.houseNumber;
          const stats = getFlockStats ? getFlockStats(flock.houseNumber) : null;
          const totalBirds = stats ? stats.totalCurrent : ((Number(flock.currentFemales) || 0) + (Number(flock.currentMales) || 0));
          const ageWeeks = stats ? stats.ageWeeks : 38;

          return (
            <button
              key={flock.houseNumber}
              onClick={() => onSelectHouse(flock.houseNumber)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-300/50'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
              }`}
            >
              <span>{flock.houseNumber}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-teal-900/50 text-teal-200' : 'bg-slate-200/70 text-slate-500'
                }`}
              >
                W{ageWeeks}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Prev / Next House Buttons & Live Micro-Stats */}
      <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
        {selectedHouse !== 'All' && (() => {
          const fStats = getFlockStats ? getFlockStats(selectedHouse) : null;
          return (
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
              <span className="flex items-center gap-1 text-teal-700">
                <Bird className="w-3.5 h-3.5" />
                <span>{(fStats?.totalCurrent || 0).toLocaleString()} birds</span>
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-rose-700">
                {typeof fStats?.livabilityPct === 'number' && !isNaN(fStats.livabilityPct) ? `${fStats.livabilityPct.toFixed(1)}% livability` : '100.0% livability'}
              </span>
            </div>
          );
        })()}

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Previous House ( [ )"
            aria-label="Previous House"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Next House ( ] )"
            aria-label="Next House"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
