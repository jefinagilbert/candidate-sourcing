'use client';

import React, { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { CandidateCard } from './CandidateCard';
import { CandidateModal } from './CandidateModal';
import { EmptyState } from '../states/EmptyState';
import {
  clearAllFilters,
  reevaluateWithFilters,
} from '../../redux/slices/sourcingSlice';
import { Users, FilterX, RotateCcw, Sparkles, Loader2 } from 'lucide-react';

export const CandidateList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { candidates, status, filters, rubric, strictMatchMode, isReevaluating } =
    useAppSelector((state) => state.sourcing);

  // Live client-side filtering on current results
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const profile = c.profile;

      // 1. Experience
      const minExp = filters.min_years_experience ?? 0;
      const maxExp = filters.max_years_experience ?? 30;
      if (profile.years_experience < minExp || profile.years_experience > maxExp) {
        return false;
      }

      // 2. Company Types
      if (filters.company_types && filters.company_types.length > 0) {
        const currentMatch = filters.company_types.includes(profile.current_company_type);
        const pastMatch = profile.past_companies?.some((p) =>
          filters.company_types.includes(p.company_type)
        );
        if (!currentMatch && !pastMatch) return false;
      }

      // 3. Target Companies
      if (filters.target_companies && filters.target_companies.length > 0) {
        const normTargets = filters.target_companies.map((t) => t.toLowerCase().trim());
        const compMatch = (compName?: string) => {
          if (!compName) return false;
          const c = compName.toLowerCase().trim();
          return normTargets.some((t) => c.includes(t) || t.includes(c));
        };
        const currentMatch = compMatch(profile.current_company);
        const pastMatch = profile.past_companies?.some((p) => compMatch(p.company));
        if (!currentMatch && !pastMatch) return false;
      }

      // 4. Skills
      if (filters.skills && filters.skills.length > 0) {
        const normSkills = profile.skills.map((s) => s.toLowerCase());
        const matchesSkill = filters.skills.some((fs) =>
          normSkills.some((s) => s.includes(fs.toLowerCase()) || fs.toLowerCase().includes(s))
        );
        if (!matchesSkill) return false;
      }

      // 5. Locations
      if (filters.locations && filters.locations.length > 0) {
        const candLoc = (profile.location || '').toLowerCase();
        const matchesLoc = filters.locations.some((l) => {
          const norm = l.toLowerCase().trim();
          return candLoc.includes(norm) || norm.includes(candLoc) || candLoc === 'remote' || norm === 'remote';
        });
        if (!matchesLoc) return false;
      }

      return true;
    });
  }, [candidates, filters]);

  if (candidates.length === 0 && status !== 'searching') {
    return <EmptyState />;
  }

  const isFiltered = filteredCandidates.length < candidates.length;

  return (
    <div className="space-y-3.5">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span>Top Matches</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono font-medium">
            {isFiltered
              ? `${filteredCandidates.length} of ${candidates.length}`
              : candidates.length}
          </span>
          {isFiltered && (
            <span className="text-[11px] text-indigo-400 font-normal">
              (filters active)
            </span>
          )}
        </h2>
        <span className="text-[11px] text-zinc-500">
          Ranked by match score
        </span>
      </div>

      {/* Candidate Cards or Filtered Empty State */}
      {filteredCandidates.length > 0 ? (
        <div className="space-y-3">
          {filteredCandidates.map((candidate, idx) => (
            <CandidateCard
              key={candidate.profile.id}
              candidate={candidate}
              rank={idx + 1}
              targetCompanies={filters.target_companies}
            />
          ))}
        </div>
      ) : (
        /* Filtered Empty State */
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-card/50 p-8 text-center space-y-3">
          <div className="inline-flex p-3 rounded-xl bg-zinc-800/80 text-zinc-400">
            <FilterX className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-zinc-200">
              No current results match the selected filters
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              None of the {candidates.length} candidate profiles currently on screen match your filter combination.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => dispatch(clearAllFilters())}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
            <button
              onClick={() =>
                dispatch(
                  reevaluateWithFilters({
                    filters,
                    rubric,
                    strictMatch: strictMatchMode,
                  })
                )
              }
              disabled={isReevaluating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              {isReevaluating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Search Full Pool (150 candidates)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Profile Detail Drilldown Modal */}
      <CandidateModal />
    </div>
  );
};
