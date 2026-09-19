'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export const ThinkingState: React.FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-12 p-6 rounded-xl bg-card border border-cardBorder text-center animate-fade-in">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto mb-2.5" />
      <h3 className="text-sm font-semibold text-zinc-200 mb-0.5">Searching Candidates</h3>
      <p className="text-xs text-zinc-500">
        Matching skills, experience, and background criteria...
      </p>
    </div>
  );
};
