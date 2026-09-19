'use client';

import React from 'react';
import { useAppSelector } from '../../redux/hooks';
import { CandidateCard } from './CandidateCard';
import { CandidateModal } from './CandidateModal';
import { EmptyState } from '../states/EmptyState';
import { Users } from 'lucide-react';

export const CandidateList: React.FC = () => {
  const { candidates, status } = useAppSelector(
    (state) => state.sourcing
  );

  if (candidates.length === 0 && status !== 'searching') {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3.5">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span>Top Matches</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
            {candidates.length}
          </span>
        </h2>
        <span className="text-[11px] text-zinc-500">
          Ranked by match score
        </span>
      </div>

      {/* Candidate Cards */}
      <div className="space-y-3">
        {candidates.map((candidate, idx) => (
          <CandidateCard key={candidate.profile.id} candidate={candidate} rank={idx + 1} />
        ))}
      </div>

      {/* Profile Detail Drilldown Modal */}
      <CandidateModal />
    </div>
  );
};
