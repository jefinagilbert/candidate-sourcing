'use client';

import React from 'react';
import { useAppSelector } from '../redux/hooks';
import { Header } from '../components/common/Header';
import { SearchBar } from '../components/search/SearchBar';
import { FilterRubricPanel } from '../components/filters/FilterRubricPanel';
import { CandidateList } from '../components/candidates/CandidateList';
import { RefinementChat } from '../components/chat/RefinementChat';
import { FreezeModal } from '../components/freeze/FreezeModal';
import { ThinkingState } from '../components/states/ThinkingState';
import { ErrorState } from '../components/states/ErrorState';
import { ClarificationState } from '../components/states/ClarificationState';
import { EmptyState } from '../components/states/EmptyState';
import { Users, Sparkles } from 'lucide-react';

export default function SourcingDashboard() {
  const { status, candidates, needsClarification, currentQuery } = useAppSelector(
    (state) => state.sourcing
  );

  const hasSearched =
    currentQuery.length > 0 ||
    candidates.length > 0 ||
    status === 'searching' ||
    status === 'refining' ||
    needsClarification;

  return (
    <div className="min-h-screen flex flex-col bg-background text-zinc-300">
      {/* Header */}
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col justify-center">
        {!hasSearched ? (
          /* 1. Initial Landing Search View */
          <section className="my-auto max-w-2xl mx-auto w-full text-center space-y-5 py-12 animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-300 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI-Powered Talent Matching</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
              Find the right candidates
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Describe your role requirements in plain English. Matching candidates will be automatically identified, scored, and ranked.
            </p>

            <div className="pt-2">
              <SearchBar isInitialView={true} />
            </div>
          </section>
        ) : (
          /* 2. Active Search & Refinement View */
          <div className="space-y-5 animate-fade-in">
            {/* Search Bar */}
            <div className="w-full">
              <SearchBar isInitialView={false} />
            </div>

            {/* States */}
            {status === 'searching' && <ThinkingState />}

            {status === 'error' && <ErrorState />}

            {needsClarification && status !== 'searching' && <ClarificationState />}

            {!needsClarification && status !== 'searching' && status !== 'error' && (
              <>
                {candidates.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left: Criteria & Candidates */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                      <FilterRubricPanel />
                      <CandidateList />
                    </div>

                    {/* Right: Refine Matches Panel */}
                    <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20">
                      <RefinementChat />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Shortlist Export Modal */}
      <FreezeModal />

      {/* Footer */}
      <footer className="border-t border-cardBorder py-3.5 bg-background text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <span>Flexiple Candidate Sourcing</span>
          <span>48 Candidate Pool</span>
        </div>
      </footer>
    </div>
  );
}
