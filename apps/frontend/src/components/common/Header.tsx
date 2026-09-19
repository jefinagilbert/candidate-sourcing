'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { setShowFreezeModal } from '../../redux/slices/uiSlice';
import { resetSearchState } from '../../redux/slices/sourcingSlice';
import { clearChat } from '../../redux/slices/chatSlice';
import { Sparkles, Download, RotateCcw } from 'lucide-react';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { candidates } = useAppSelector((state) => state.sourcing);

  const handleReset = () => {
    dispatch(resetSearchState());
    dispatch(clearChat());
  };

  return (
    <header className="w-full border-b border-cardBorder bg-card/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm text-zinc-100">
              Flexiple Talent
            </span>
            <span className="hidden sm:inline-block text-[11px] text-zinc-400 ml-2 font-normal">
              Candidate Sourcing
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {candidates.length > 0 && (
            <>
              <button
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 text-xs font-medium transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Search</span>
              </button>

              <button
                onClick={() => dispatch(setShowFreezeModal(true))}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-zinc-700/80 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Shortlist</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
