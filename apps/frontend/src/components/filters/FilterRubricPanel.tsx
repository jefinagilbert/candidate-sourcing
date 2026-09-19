'use client';

import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import {
  toggleCompanyType,
  addSkillFilter,
  removeSkillFilter,
  setExperienceRange,
  reevaluateWithFilters,
} from '../../redux/slices/sourcingSlice';
import { APP_CONFIG } from '../../constants/appConfig';
import { CompanyType } from '../../types/sourcing.types';
import { SlidersHorizontal, Plus, X, Building2 } from 'lucide-react';

export const FilterRubricPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filters, rubric } = useAppSelector((state) => state.sourcing);
  const [newSkill, setNewSkill] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim()) {
      dispatch(addSkillFilter(newSkill.trim()));
      setNewSkill('');
    }
  };

  const handleApply = () => {
    dispatch(reevaluateWithFilters({ filters, rubric }));
    setIsEditing(false);
  };

  return (
    <div className="w-full rounded-2xl bg-card border border-cardBorder p-4 space-y-3 text-xs shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-zinc-300 font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Search Criteria</span>
        </div>

        <button
          onClick={() => {
            if (isEditing) handleApply();
            else setIsEditing(true);
          }}
          className="text-indigo-400 hover:text-indigo-300 text-xs font-medium underline underline-offset-2 transition-colors"
        >
          {isEditing ? 'Done' : 'Edit Criteria'}
        </button>
      </div>

      {/* Summary View */}
      {!isEditing ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {filters.target_companies && filters.target_companies.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950/50 text-indigo-300 border border-indigo-500/40 font-semibold text-[11px] flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-indigo-400" />
              <span>Company: {filters.target_companies.join(', ')}</span>
            </span>
          )}

          {filters.skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-0.5 rounded-lg bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-medium text-[11px]"
            >
              {skill}
            </span>
          ))}

          <span className="px-2.5 py-0.5 rounded-lg bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-medium text-[11px]">
            {filters.min_years_experience} - {filters.max_years_experience} Yrs Exp
          </span>

          {filters.company_types.map((type) => (
            <span
              key={type}
              className="px-2.5 py-0.5 rounded-lg bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 capitalize font-medium text-[11px]"
            >
              {type}
            </span>
          ))}

          {filters.locations.map((loc) => (
            <span
              key={loc}
              className="px-2.5 py-0.5 rounded-lg bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-medium text-[11px]"
            >
              {loc}
            </span>
          ))}
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <div>
            <span className="text-[11px] text-zinc-400 block mb-1">Skills</span>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {filters.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => dispatch(removeSkillFilter(skill))}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddSkill} className="flex space-x-1.5 max-w-xs">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
              >
                <Plus className="w-3 h-3" />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Experience (Yrs)</span>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={filters.min_years_experience}
                  onChange={(e) =>
                    dispatch(
                      setExperienceRange({
                        min: Number(e.target.value),
                        max: filters.max_years_experience,
                      })
                    )
                  }
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                />
                <span className="text-zinc-500">-</span>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={filters.max_years_experience}
                  onChange={(e) =>
                    dispatch(
                      setExperienceRange({
                        min: filters.min_years_experience,
                        max: Number(e.target.value),
                      })
                    )
                  }
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                />
              </div>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Company Type</span>
              <div className="flex flex-wrap gap-1">
                {APP_CONFIG.companyTypes.map((t) => {
                  const active = filters.company_types.includes(t.value as CompanyType);
                  return (
                    <button
                      key={t.value}
                      onClick={() => dispatch(toggleCompanyType(t.value as CompanyType))}
                      className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                        active
                          ? 'bg-zinc-700 text-zinc-100 border-zinc-500'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
