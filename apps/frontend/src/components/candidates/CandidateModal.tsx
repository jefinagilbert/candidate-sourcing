'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { setSelectedCandidate } from '../../redux/slices/sourcingSlice';
import {
  X,
  History,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const CandidateModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const candidate = useAppSelector((state) => state.sourcing.selectedCandidate);

  if (!candidate) return null;

  const { profile, match_score, fit_level, explanation, cited_facts } = candidate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-xl bg-card border border-cardBorder shadow-xl p-5 text-zinc-200">
        {/* Close Button */}
        <button
          onClick={() => dispatch(setSelectedCandidate(null))}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start justify-between pr-8">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-100">{profile.name}</h2>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                {profile.id}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {profile.current_title} at{' '}
              <span className="text-zinc-200 font-medium">{profile.current_company}</span> (
              <span className="capitalize">{profile.current_company_type}</span>)
            </p>
          </div>

          <div className="text-right">
            <span className="text-xl font-mono font-bold text-emerald-400/90">{match_score}%</span>
            <div className="text-[9px] text-zinc-500 uppercase">{fit_level}</div>
          </div>
        </div>

        {/* Quick info grid */}
        <div className="grid grid-cols-3 gap-2 my-3.5 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px]">Experience</span>
            <span className="font-medium text-zinc-200">{profile.years_experience} Years</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Location</span>
            <span className="font-medium text-zinc-200">{profile.location}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Education</span>
            <span className="font-medium text-zinc-200 truncate block">{profile.education}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-3.5">
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
            Summary
          </h4>
          <p className="text-xs text-zinc-300 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/80 leading-relaxed">
            {profile.summary}
          </p>
        </div>

        {/* Skills */}
        <div className="mb-3.5">
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
            Skills
          </h4>
          <div className="flex flex-wrap gap-1">
            {profile.skills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 text-[11px]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Previous Roles */}
        {profile.past_companies && profile.past_companies.length > 0 && (
          <div className="mb-3.5">
            <h4 className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1 flex items-center space-x-1">
              <History className="w-3 h-3 text-zinc-400" />
              <span>Previous Roles</span>
            </h4>
            <div className="space-y-1.5">
              {profile.past_companies.map((past, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-zinc-900/40 border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-zinc-200">{past.company}</span>
                    <span className="text-zinc-400 ml-1.5">({past.title})</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-zinc-400 text-[11px]">
                    <span className="capitalize">{past.company_type}</span>
                    <span>•</span>
                    <span>{past.years} yrs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Details */}
        <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center space-x-1 text-zinc-300 font-medium text-xs mb-1">
            <Sparkles className="w-3 h-3 text-zinc-400" />
            <span>Match Justification</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed mb-2.5">{explanation}</p>

          <div className="space-y-1">
            {cited_facts?.map((fact, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-1.5 text-[11px] p-1.5 rounded bg-zinc-800/60 border border-zinc-700/40"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-zinc-200 capitalize">{fact.field}:</span>{' '}
                  <span className="text-zinc-300">{fact.value}</span>{' '}
                  <span className="text-zinc-400">({fact.relevance})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
