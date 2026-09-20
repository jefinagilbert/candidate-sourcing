'use client';

import React from 'react';
import { ScoredCandidate } from '../../types/sourcing.types';
import { useAppDispatch } from '../../redux/hooks';
import { setCandidateFeedback, setSelectedCandidate } from '../../redux/slices/sourcingSlice';
import {
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Compass,
  Building2,
  ArrowLeftRight,
} from 'lucide-react';

interface CandidateCardProps {
  candidate: ScoredCandidate;
  rank: number;
  targetCompanies?: string[];
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, rank, targetCompanies }) => {
  const dispatch = useAppDispatch();
  const { profile, match_score, explanation, feedback, is_exact_match, related_match_reason } = candidate;

  const handleFeedback = (type: 'match' | 'reject') => {
    dispatch(
      setCandidateFeedback({
        candidateId: profile.id,
        feedback: type,
      })
    );
  };

  const getCompanyBadgeClass = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'startup':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30';
      case 'scaleup':
        return 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30';
      case 'enterprise':
        return 'bg-sky-950/40 text-sky-300 border-sky-500/30';
      case 'agency':
        return 'bg-purple-950/40 text-purple-300 border-purple-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/60';
    }
  };

  // Determine if current company matches the target search or if it's a past-company match
  const hasTargetSearch = targetCompanies && targetCompanies.length > 0;
  const currentCompanyMatchesTarget = hasTargetSearch && targetCompanies.some(tc =>
    profile.current_company.toLowerCase().includes(tc.toLowerCase()) ||
    tc.toLowerCase().includes(profile.current_company.toLowerCase())
  );
  const matchingPastCompany = hasTargetSearch && !currentCompanyMatchesTarget
    ? profile.past_companies?.find(p =>
        targetCompanies.some(tc =>
          p.company.toLowerCase().includes(tc.toLowerCase()) ||
          tc.toLowerCase().includes(p.company.toLowerCase())
        )
      )
    : null;

  return (
    <div
      className={`rounded-2xl bg-card border transition-all duration-150 overflow-hidden shadow-sm ${
        feedback === 'match'
          ? 'border-emerald-600/70 bg-emerald-950/15'
          : feedback === 'reject'
          ? 'border-rose-900/40 opacity-50 bg-rose-950/10'
          : 'border-cardBorder hover:border-zinc-700'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Header: Rank, Name, Company, Match Score */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
          <div className="flex items-start space-x-3">
            {/* Rank badge */}
            <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-mono font-semibold text-xs text-indigo-400 shrink-0 mt-0.5">
              #{rank}
            </div>

            {/* Candidate Details */}
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h3
                  onClick={() => dispatch(setSelectedCandidate(candidate))}
                  className="font-semibold text-sm sm:text-base text-zinc-100 hover:text-indigo-300 cursor-pointer transition-colors"
                >
                  {profile.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border capitalize ${getCompanyBadgeClass(profile.current_company_type)}`}>
                  {profile.current_company_type}
                </span>

                {is_exact_match === false && related_match_reason && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 flex items-center space-x-1">
                    <Compass className="w-2.5 h-2.5 text-indigo-400" />
                    <span>Transferable Match</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 mt-0.5 font-medium">
                {profile.current_title} at{' '}
                <span className="text-zinc-100 font-semibold">{profile.current_company}</span>
              </p>

              {/* Past company connection badge — shown when target company matched via past employment */}
              {matchingPastCompany && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-950/50 text-amber-300 border border-amber-600/40">
                    <Building2 className="w-3 h-3 text-amber-400" />
                    Previously at {matchingPastCompany.company}
                    <span className="text-amber-400/70 font-normal ml-0.5">
                      · {matchingPastCompany.years}yr{matchingPastCompany.years !== 1 ? 's' : ''} as {matchingPastCompany.title}
                    </span>
                  </span>
                </div>
              )}

              {/* Past companies summary (compact) */}
              {profile.past_companies && profile.past_companies.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-0.5">
                    <ArrowLeftRight className="w-2.5 h-2.5" />
                    Past:
                  </span>
                  {profile.past_companies.map((pc, i) => (
                    <span
                      key={i}
                      className={`px-1.5 py-0.5 rounded text-[10px] border ${
                        hasTargetSearch && targetCompanies.some(tc =>
                          pc.company.toLowerCase().includes(tc.toLowerCase()) ||
                          tc.toLowerCase().includes(pc.company.toLowerCase())
                        )
                          ? 'bg-amber-950/40 text-amber-300 border-amber-600/30 font-semibold'
                          : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/40'
                      }`}
                    >
                      {pc.company} ({pc.years}yr)
                    </span>
                  ))}
                </div>
              )}

              {/* Experience, Location & Education */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-2">
                <span className="flex items-center space-x-1">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{profile.years_experience} yrs exp</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{profile.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate max-w-[190px]">{profile.education}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Match Score Gauge */}
          <div className="flex items-center space-x-2 shrink-0 sm:text-right">
            <div className="px-2.5 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">{match_score}%</span>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold ml-1.5">Match</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.skills.map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-zinc-800/70 text-zinc-300 border border-zinc-700/50 text-[11px]"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Match Reason */}
        <div className="mt-3 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/90 text-xs text-zinc-300 leading-relaxed">
          <div className="flex items-center space-x-1 text-indigo-400 font-medium mb-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why this candidate matches:</span>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed">{explanation}</p>
        </div>

        {/* Actions */}
        <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleFeedback('match')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                feedback === 'match'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-zinc-800/80 hover:bg-emerald-950/40 text-zinc-300 border-zinc-700/60 hover:text-emerald-300 hover:border-emerald-600/40'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Shortlist</span>
            </button>
            <button
              onClick={() => handleFeedback('reject')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                feedback === 'reject'
                  ? 'bg-rose-700 text-white border-rose-600 shadow-sm'
                  : 'bg-zinc-800/80 hover:bg-rose-950/40 text-zinc-300 border-zinc-700/60 hover:text-rose-300 hover:border-rose-600/40'
              }`}
            >
              <ThumbsDown className="w-3 h-3" />
              <span>Pass</span>
            </button>
          </div>

          <button
            onClick={() => dispatch(setSelectedCandidate(candidate))}
            className="flex items-center space-x-1 text-zinc-400 hover:text-indigo-300 text-xs font-medium transition-colors"
          >
            <span>Full Profile</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
