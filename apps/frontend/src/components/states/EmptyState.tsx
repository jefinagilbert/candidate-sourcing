'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  setExperienceRange,
  runInitialSearch,
  setQuery,
  resetSearchState,
  setStrictMatchMode,
} from '../../redux/slices/sourcingSlice';
import { UserX, RotateCcw, Building2, Sparkles, Compass } from 'lucide-react';

export const EmptyState: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filters, currentQuery, strictMatchMode } = useAppSelector((state) => state.sourcing);

  const availableCompanies = [
    'Oracle',
    'Deloitte',
    'Google',
    'Amazon',
    'Swiggy',
    'Razorpay',
    'Sarvam AI',
    'Blinkit',
    'Citadel',
    'Canva',
    'Innovaccer',
    'Freshworks',
    'Zscaler',
    'Postman',
    'Salesforce',
  ];

  const handleCompanyClick = (company: string) => {
    const q = `candidates who worked at ${company}`;
    dispatch(setQuery(q));
    dispatch(runInitialSearch({ query: q, strictMatch: strictMatchMode }));
  };

  const handleSwitchToSmartExpansion = () => {
    dispatch(setStrictMatchMode(false));
    if (currentQuery) {
      dispatch(runInitialSearch({ query: currentQuery, strictMatch: false }));
    }
  };

  const handleReset = () => {
    dispatch(resetSearchState());
  };

  return (
    <div className="w-full my-4 p-6 sm:p-8 rounded-2xl bg-card border border-cardBorder shadow-lg text-center animate-fade-in">
      {/* Icon */}
      <div className="w-12 h-12 rounded-2xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center mx-auto mb-3.5 text-zinc-400">
        <UserX className="w-6 h-6 text-zinc-400" />
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mb-1">
        No Matching Candidates Found
      </h3>

      <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4 leading-relaxed">
        {filters.target_companies && filters.target_companies.length > 0
          ? `We couldn't find any candidate profiles in our 150-profile talent pool with verified experience at "${filters.target_companies.join(', ')}" in Strict Match mode.`
          : 'No candidate profiles matched all of your strict criteria. Try switching to Smart Expansion or exploring available companies below.'}
      </p>

      {/* Switch to Smart Expansion Action */}
      {strictMatchMode && (
        <div className="mb-5 max-w-md mx-auto">
          <button
            onClick={handleSwitchToSmartExpansion}
            className="w-full py-2 px-3 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-700/60 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Switch to Smart Expansion (Include Related Companies & Skills)</span>
          </button>
        </div>
      )}

      {/* Available Companies in the pool */}
      <div className="mb-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 max-w-lg mx-auto text-left">
        <div className="flex items-center space-x-1.5 text-xs font-medium text-zinc-300 mb-2.5">
          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Available companies in the 150-candidate pool:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availableCompanies.map((comp) => (
            <button
              key={comp}
              onClick={() => handleCompanyClick(comp)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 border border-zinc-700/60 text-xs font-medium transition-all"
            >
              {comp}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
        <button
          onClick={handleReset}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span>New Search</span>
        </button>

        <button
          onClick={() => dispatch(setExperienceRange({ min: 0, max: 20 }))}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 text-xs transition-colors"
        >
          <span>Widen Experience (0-20 yrs)</span>
        </button>

        <button
          onClick={() => {
            const q = 'RDS developers with 4-7 years of experience who have worked at startups in Bangalore.';
            dispatch(setQuery(q));
            dispatch(runInitialSearch({ query: q, strictMatch: false }));
          }}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-white text-zinc-900 text-xs font-medium transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          <span>Try Default Example</span>
        </button>
      </div>
    </div>
  );
};
