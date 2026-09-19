'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { runInitialSearch, setQuery } from '../../redux/slices/sourcingSlice';
import { Search, ArrowRight, Sparkles } from 'lucide-react';

interface SearchBarProps {
  isInitialView?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ isInitialView = false }) => {
  const dispatch = useAppDispatch();
  const { currentQuery, status } = useAppSelector((state) => state.sourcing);
  const [inputText, setInputText] = useState(
    currentQuery || 'RDS developers with 4-7 years of experience who have worked at startups, for a role based in Bangalore.'
  );

  useEffect(() => {
    if (currentQuery) {
      setInputText(currentQuery);
    }
  }, [currentQuery]);

  const isSearching = status === 'searching';

  const handleSearch = (queryText?: string) => {
    const textToSearch = (queryText || inputText).trim();
    if (!textToSearch || isSearching) return;
    dispatch(setQuery(textToSearch));
    dispatch(runInitialSearch(textToSearch));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const quickPresets = [
    { label: 'RDS & Startups (4-7 yrs)', query: 'RDS developers with 4-7 years of experience who have worked at startups, for a role based in Bangalore.' },
    { label: 'Worked at Oracle', query: 'just give me only the employees who worked only on oracle' },
    { label: 'Big 4 Consulting', query: 'engineers with experience in Big 4 consulting firms' },
    { label: 'GenAI & LLM Experts', query: 'Generative AI and LLM engineers with PyTorch, transformers, and fine-tuning experience' },
    { label: 'HFT & Quant C++', query: 'C++ quantitative developers and HFT low latency engineers' },
    { label: 'Fintech & Scaleups', query: 'Senior backend engineers with fintech experience in scaleup companies' },
  ];

  return (
    <div className={`w-full mx-auto ${isInitialView ? 'max-w-2xl' : 'max-w-3xl'}`}>
      <div className="rounded-2xl bg-card border border-cardBorder focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 shadow-md transition-all">
        <div className="p-3.5 sm:p-4 flex flex-col space-y-2.5">
          <div className="flex items-start space-x-3">
            <Search className="w-4 h-4 text-zinc-400 mt-1 shrink-0" />
            <textarea
              rows={isInitialView ? 2 : 2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your role requirements (e.g. 'RDS developers with 4-7 years exp at startups' or 'worked at Oracle')..."
              className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm resize-none focus:outline-none leading-relaxed"
              disabled={isSearching}
            />
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/80 text-xs">
            <span className="text-zinc-500 text-[11px]">Press Enter ↵ to search</span>

            <button
              onClick={() => handleSearch()}
              disabled={!inputText.trim() || isSearching}
              className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs disabled:opacity-40 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              {isSearching ? (
                <span>Finding...</span>
              ) : (
                <>
                  <span>Find Candidates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Suggestion Chips */}
      {isInitialView && (
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-500">
          <span className="text-[11px] mr-1 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Try:</span>
          </span>
          {quickPresets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(p.query);
                handleSearch(p.query);
              }}
              className="px-2.5 py-1 rounded-full bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 border border-zinc-700/60 text-[11px] font-medium transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
