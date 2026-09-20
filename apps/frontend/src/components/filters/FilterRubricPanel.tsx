'use client';

import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import {
  toggleCompanyType,
  addSkillFilter,
  removeSkillFilter,
  setExperienceRange,
  reevaluateWithFilters,
  toggleStrictMatchMode,
  addTargetCompany,
  removeTargetCompany,
  clearAllFilters,
  toggleLocation,
} from '../../redux/slices/sourcingSlice';
import { APP_CONFIG } from '../../constants/appConfig';
import { CompanyType } from '../../types/sourcing.types';
import {
  Filter,
  Plus,
  X,
  Building2,
  Shield,
  Compass,
  RotateCcw,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Briefcase,
} from 'lucide-react';

export const FilterRubricPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filters, rubric, strictMatchMode, isReevaluating } = useAppSelector(
    (state) => state.sourcing
  );

  const [newSkill, setNewSkill] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Active filter counting
  const hasTargetCompanies = (filters.target_companies?.length ?? 0) > 0;
  const hasSkills = filters.skills.length > 0;
  const hasCompanyTypes = filters.company_types.length > 0;
  const hasLocations = filters.locations.length > 0;
  const hasCustomExp = filters.min_years_experience > 0 || filters.max_years_experience < 30;

  const activeFilterCount =
    (hasTargetCompanies ? 1 : 0) +
    (hasSkills ? 1 : 0) +
    (hasCompanyTypes ? 1 : 0) +
    (hasLocations ? 1 : 0) +
    (hasCustomExp ? 1 : 0);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim()) {
      dispatch(addSkillFilter(newSkill.trim()));
      setNewSkill('');
    }
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompany.trim()) {
      dispatch(addTargetCompany(newCompany.trim()));
      setNewCompany('');
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocation.trim()) {
      dispatch(toggleLocation(newLocation.trim()));
      setNewLocation('');
    }
  };

  const handleSearchFullPool = () => {
    dispatch(reevaluateWithFilters({ filters, rubric, strictMatch: strictMatchMode }));
  };

  const handleToggleStrict = () => {
    dispatch(toggleStrictMatchMode());
    dispatch(
      reevaluateWithFilters({
        filters: { ...filters, strict_match: !strictMatchMode },
        rubric,
        strictMatch: !strictMatchMode,
      })
    );
  };

  const handleSetExpPreset = (min: number, max: number) => {
    dispatch(setExperienceRange({ min, max }));
  };

  return (
    <div className="w-full rounded-2xl bg-card border border-cardBorder p-4 space-y-3.5 text-xs shadow-sm transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/40 text-indigo-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-zinc-200 text-xs">Search Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Filters apply instantly below. Click &quot;Search Full Pool&quot; to query all 150 candidates.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Reset Filters Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => dispatch(clearAllFilters())}
              className="flex items-center space-x-1 px-2 py-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-[11px] transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Strict Match vs Smart Expansion Mode Toggle */}
          <button
            onClick={handleToggleStrict}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              strictMatchMode
                ? 'bg-zinc-800/90 text-zinc-200 border-zinc-700 hover:bg-zinc-750 shadow-xs'
                : 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60 hover:bg-indigo-900/50 shadow-xs'
            }`}
            title={
              strictMatchMode
                ? 'Strict Match: Only returns candidates who strictly match companies, skills, and criteria'
                : 'Smart Expansion: Includes candidates with transferable skills and related companies'
            }
          >
            {strictMatchMode ? (
              <>
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Strict Match</span>
              </>
            ) : (
              <>
                <Compass className="w-3 h-3 text-indigo-400" />
                <span>Smart Expansion</span>
              </>
            )}
          </button>

          {/* Collapse/Expand toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title={isCollapsed ? 'Expand filters' : 'Collapse filters'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter Controls Body */}
      {!isCollapsed && (
        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
          {/* Row 1: Target Company & Company Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Target Companies */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-indigo-400" />
                <span>Target Company</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {filters.target_companies?.map((comp) => (
                  <span
                    key={comp}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-700/60 text-[11px] font-medium"
                  >
                    <span>{comp}</span>
                    <button
                      onClick={() => dispatch(removeTargetCompany(comp))}
                      className="text-indigo-400 hover:text-indigo-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <form onSubmit={handleAddCompany} className="inline-flex items-center">
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="+ Add company..."
                    className="w-28 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 rounded-md px-2 py-0.5 text-[11px] text-zinc-200 focus:outline-none transition-colors"
                  />
                </form>
              </div>
            </div>

            {/* Company Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 flex items-center space-x-1">
                <Briefcase className="w-3 h-3 text-indigo-400" />
                <span>Company Type</span>
              </label>
              <div className="flex flex-wrap gap-1">
                {APP_CONFIG.companyTypes.map((t) => {
                  const active = filters.company_types.includes(t.value as CompanyType);
                  return (
                    <button
                      key={t.value}
                      onClick={() => dispatch(toggleCompanyType(t.value as CompanyType))}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                        active
                          ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60 shadow-xs'
                          : 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Experience & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Experience Range */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-400">Experience (Years)</label>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleSetExpPreset(0, 30)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1 py-0.5 rounded hover:bg-zinc-800"
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleSetExpPreset(1, 3)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1 py-0.5 rounded hover:bg-zinc-800"
                  >
                    1-3y
                  </button>
                  <button
                    onClick={() => handleSetExpPreset(4, 7)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1 py-0.5 rounded hover:bg-zinc-800"
                  >
                    4-7y
                  </button>
                  <button
                    onClick={() => handleSetExpPreset(8, 25)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1 py-0.5 rounded hover:bg-zinc-800"
                  >
                    8+y
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={filters.min_years_experience}
                  onChange={(e) =>
                    dispatch(
                      setExperienceRange({
                        min: Math.max(0, Number(e.target.value)),
                        max: filters.max_years_experience,
                      })
                    )
                  }
                  className="w-16 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 rounded-md px-2 py-0.5 text-xs text-zinc-200 text-center"
                />
                <span className="text-zinc-500">to</span>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={filters.max_years_experience}
                  onChange={(e) =>
                    dispatch(
                      setExperienceRange({
                        min: filters.min_years_experience,
                        max: Math.min(30, Number(e.target.value)),
                      })
                    )
                  }
                  className="w-16 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 rounded-md px-2 py-0.5 text-xs text-zinc-200 text-center"
                />
                <span className="text-zinc-400 text-[11px]">years</span>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-indigo-400" />
                <span>Locations</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {filters.locations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-zinc-800/90 text-zinc-300 border border-zinc-700/60 text-[11px]"
                  >
                    <span>{loc}</span>
                    <button
                      onClick={() => dispatch(toggleLocation(loc))}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <form onSubmit={handleAddLocation} className="inline-flex items-center">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="+ Add location..."
                    className="w-28 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 rounded-md px-2 py-0.5 text-[11px] text-zinc-200 focus:outline-none transition-colors"
                  />
                </form>
              </div>
            </div>
          </div>

          {/* Row 3: Skills */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-medium text-zinc-400 block">Required Skills</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-zinc-800/80 text-zinc-200 border border-zinc-700/70 text-[11px] font-medium"
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
              <form onSubmit={handleAddSkill} className="inline-flex items-center">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="+ Add skill..."
                  className="w-28 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 rounded-md px-2 py-0.5 text-[11px] text-zinc-200 focus:outline-none transition-colors"
                />
              </form>
            </div>
          </div>

          {/* Action Row: Search Full Pool */}
          <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500">
              Want to find new candidates from the entire 150-talent pool?
            </span>
            <button
              onClick={handleSearchFullPool}
              disabled={isReevaluating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/60 text-white font-medium text-xs shadow-sm transition-all"
            >
              {isReevaluating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching Full Pool...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Search Full Pool (150 candidates)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
