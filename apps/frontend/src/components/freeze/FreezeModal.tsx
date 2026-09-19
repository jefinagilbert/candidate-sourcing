'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { setShowFreezeModal } from '../../redux/slices/uiSlice';
import { freezeCurrentSearch, unfreezeSearch } from '../../redux/slices/sourcingSlice';
import {
  Lock,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  FileCode,
  RotateCcw,
} from 'lucide-react';

export const FreezeModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const show = useAppSelector((state) => state.ui.showFreezeModal);
  const { filters, rubric, candidates, freezeData } = useAppSelector(
    (state) => state.sourcing
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (show) {
      dispatch(
        freezeCurrentSearch({
          filters,
          rubric,
          shortlist: candidates,
        })
      );
    }
  }, [show, dispatch, filters, rubric, candidates]);

  if (!show) return null;

  const handleCopyReport = () => {
    const report = `# Candidate Sourcing Shortlist
Generated on: ${new Date().toLocaleString()}

## Search Criteria
- Skills: ${filters.skills.join(', ')}
- Experience: ${filters.min_years_experience} - ${filters.max_years_experience} Years
- Locations: ${filters.locations.join(', ')}
- Company Types: ${filters.company_types.join(', ')}

## Shortlisted Candidates
${candidates
  .map(
    (c, i) => `
${i + 1}. ${c.profile.name} (Match: ${c.match_score}%)
- Title: ${c.profile.current_title} at ${c.profile.current_company} (${c.profile.current_company_type})
- Experience: ${c.profile.years_experience} Yrs | Location: ${c.profile.location}
- Skills: ${c.profile.skills.join(', ')}
- Match Reason: ${c.explanation}
`
  )
  .join('')}
`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const headers = ['Rank', 'Name', 'Title', 'Company', 'Company Type', 'Experience', 'Location', 'Match Score', 'Skills', 'Match Reason'];
    const rows = candidates.map((c, i) => [
      i + 1,
      `"${c.profile.name}"`,
      `"${c.profile.current_title}"`,
      `"${c.profile.current_company}"`,
      `"${c.profile.current_company_type}"`,
      `${c.profile.years_experience} Years`,
      `"${c.profile.location}"`,
      `${c.match_score}%`,
      `"${c.profile.skills.join(', ')}"`,
      `"${c.explanation.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `shortlist_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          freezeData || {
            filters,
            rubric,
            shortlist: candidates,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `shortlist_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-card border border-cardBorder shadow-xl p-5 sm:p-6 text-zinc-200">
        <button
          onClick={() => dispatch(setShowFreezeModal(false))}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-100">Shortlist Export</h2>
            <p className="text-[11px] text-zinc-500">Criteria and candidates ready for export</p>
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 mb-4 text-xs">
          <span className="font-medium text-zinc-300 block mb-1">Search Criteria:</span>
          <div className="grid grid-cols-2 gap-1.5 text-zinc-400 text-[11px]">
            <div><span className="text-zinc-500">Skills:</span> {filters.skills.join(', ')}</div>
            <div><span className="text-zinc-500">Experience:</span> {filters.min_years_experience} - {filters.max_years_experience} Years</div>
            <div><span className="text-zinc-500">Company:</span> {filters.company_types.join(', ')}</div>
            <div><span className="text-zinc-500">Locations:</span> {filters.locations.join(', ')}</div>
          </div>
        </div>

        {/* Candidate List */}
        <div className="space-y-2 mb-5">
          {candidates.map((c, idx) => (
            <div
              key={c.profile.id}
              className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-zinc-500 font-mono text-[11px]">#{idx + 1}</span>
                <div>
                  <div className="font-medium text-zinc-200 text-xs">{c.profile.name}</div>
                  <div className="text-zinc-500 text-[10px]">
                    {c.profile.current_title} at {c.profile.current_company} • {c.profile.years_experience} yrs exp • {c.profile.location}
                  </div>
                </div>
              </div>
              <span className="font-mono font-medium text-emerald-400/90 text-xs">
                {c.match_score}%
              </span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-zinc-800 gap-2">
          <button
            onClick={() => {
              dispatch(unfreezeSearch());
              dispatch(setShowFreezeModal(false));
            }}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Continue Editing</span>
          </button>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
            >
              <FileSpreadsheet className="w-3 h-3 text-zinc-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-white text-zinc-900 text-xs font-medium transition-colors"
            >
              <FileCode className="w-3 h-3" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
