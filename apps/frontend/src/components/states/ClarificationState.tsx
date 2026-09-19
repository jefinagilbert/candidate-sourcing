'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { runInitialSearch, setQuery } from '../../redux/slices/sourcingSlice';
import { HelpCircle, ArrowRight, Lightbulb } from 'lucide-react';

export const ClarificationState: React.FC = () => {
  const dispatch = useAppDispatch();
  const { clarificationMessage, suggestedClarifications } = useAppSelector(
    (state) => state.sourcing
  );

  const handleApplySuggestion = (text: string) => {
    dispatch(setQuery(text));
    dispatch(runInitialSearch(text));
  };

  return (
    <div className="w-full max-w-xl mx-auto my-6 p-5 rounded-xl bg-card border border-zinc-800 shadow-sm animate-fade-in">
      <div className="flex items-center space-x-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">
            More Details Needed
          </h3>
          <p className="text-[11px] text-zinc-500">
            The input was too broad or missing key role requirements
          </p>
        </div>
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 mb-4">
        {clarificationMessage ||
          'Please specify the role, core skills, target experience range, or preferred company type to accurately find matches.'}
      </p>

      {/* Suggested Clarifications */}
      {suggestedClarifications && suggestedClarifications.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-zinc-400 flex items-center space-x-1">
            <Lightbulb className="w-3.5 h-3.5 text-zinc-400" />
            <span>Click a suggestion to search:</span>
          </div>

          <div className="space-y-1.5">
            {suggestedClarifications.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleApplySuggestion(sug)}
                className="w-full text-left p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 transition-colors flex items-center justify-between group"
              >
                <span>&ldquo;{sug}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
