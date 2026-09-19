'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { runInitialSearch } from '../../redux/slices/sourcingSlice';
import { AlertCircle, RotateCcw } from 'lucide-react';

export const ErrorState: React.FC = () => {
  const dispatch = useAppDispatch();
  const { errorMessage, currentQuery } = useAppSelector((state) => state.sourcing);

  const handleRetry = () => {
    if (currentQuery) {
      dispatch(runInitialSearch(currentQuery));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-8 p-5 rounded-xl bg-card border border-zinc-800 text-center animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-2.5 text-zinc-400">
        <AlertCircle className="w-4 h-4" />
      </div>

      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Search Request Failed</h3>
      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
        {errorMessage || 'Unable to process search at this time. Please try again.'}
      </p>

      <button
        onClick={handleRetry}
        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-200 hover:bg-white text-zinc-900 text-xs font-medium transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Retry Search</span>
      </button>
    </div>
  );
};
