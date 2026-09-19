import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  SearchFilters,
  FitRubric,
  ScoredCandidate,
  CompanyType,
} from '../../types/sourcing.types';
import { SourcingApiService } from '../../services/sourcing.service';

interface SourcingSliceState {
  currentQuery: string;
  needsClarification: boolean;
  clarificationMessage: string | null;
  suggestedClarifications: string[];
  filters: SearchFilters;
  rubric: FitRubric;
  candidates: ScoredCandidate[];
  totalPoolCount: number;
  filteredCount: number;
  exactMatchCount: number;
  activeLlmProvider: string;
  status: 'idle' | 'searching' | 'refining' | 'frozen' | 'error';
  errorMessage: string | null;
  refinementCount: number;
  freezeData: any | null;
  selectedCandidate: ScoredCandidate | null;
}

const initialFilters: SearchFilters = {
  skills: ['AWS RDS', 'Node.js', 'PostgreSQL'],
  min_years_experience: 4,
  max_years_experience: 7,
  locations: ['Bangalore'],
  company_types: ['startup'],
};

const initialRubric: FitRubric = {
  role_summary: 'Sourcing RDS developers with 4-7 years of experience who have worked at startups in Bangalore.',
  criteria: [
    {
      id: 'tech_mastery',
      name: 'AWS RDS & Backend Engineering',
      weight: 40,
      description: 'Hands-on proficiency with AWS RDS, relational optimization, and high concurrency services.',
      positive_signals: ['AWS RDS tuning', 'PostgreSQL / MySQL depth', 'Node.js backend microservices'],
      negative_signals: ['Only basic frontend or no cloud database experience'],
    },
    {
      id: 'startup_dna',
      name: 'Startup Agility & Velocity',
      weight: 35,
      description: 'Experience shipping fast-paced products and handling end-to-end feature ownership at startups.',
      positive_signals: ['Early-stage startup background', 'High independence and feature ownership'],
      negative_signals: ['Pure enterprise legacy maintenance'],
    },
    {
      id: 'seniority_alignment',
      name: 'Experience Alignment',
      weight: 25,
      description: 'Seniority matching the 4-7 year target window.',
      positive_signals: ['4 to 7 years in production software engineering'],
      negative_signals: ['Junior under 3 years or overqualified staff level'],
    },
  ],
  dealbreakers: ['No AWS RDS or relational database background', 'Less than 3 years experience'],
};

const initialState: SourcingSliceState = {
  currentQuery: '',
  needsClarification: false,
  clarificationMessage: null,
  suggestedClarifications: [],
  filters: initialFilters,
  rubric: initialRubric,
  candidates: [],
  totalPoolCount: 48,
  filteredCount: 0,
  exactMatchCount: 0,
  activeLlmProvider: 'gemini',
  status: 'idle',
  errorMessage: null,
  refinementCount: 0,
  freezeData: null,
  selectedCandidate: null,
};

export const runInitialSearch = createAsyncThunk(
  'sourcing/runInitialSearch',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await SourcingApiService.executeInitialSearch(query);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to execute sourcing search');
    }
  }
);

export const runRefinement = createAsyncThunk(
  'sourcing/runRefinement',
  async (
    params: {
      userFeedback: string;
      currentFilters: SearchFilters;
      currentRubric: FitRubric;
      profileSignals?: any[];
      chatHistory?: any[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await SourcingApiService.executeRefinement(params);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to refine search criteria');
    }
  }
);

export const reevaluateWithFilters = createAsyncThunk(
  'sourcing/reevaluateWithFilters',
  async (params: { filters: SearchFilters; rubric: FitRubric }, { rejectWithValue }) => {
    try {
      const response = await SourcingApiService.reevaluateFilters(params.filters, params.rubric);
      return { ...response, filters: params.filters, rubric: params.rubric };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to re-evaluate filters');
    }
  }
);

export const freezeCurrentSearch = createAsyncThunk(
  'sourcing/freezeCurrentSearch',
  async (
    params: { filters: SearchFilters; rubric: FitRubric; shortlist: ScoredCandidate[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await SourcingApiService.freezeSearch(
        params.filters,
        params.rubric,
        params.shortlist
      );
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to freeze search');
    }
  }
);

export const sourcingSlice = createSlice({
  name: 'sourcing',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.currentQuery = action.payload;
    },
    updateFilters(state, action: PayloadAction<Partial<SearchFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    toggleCompanyType(state, action: PayloadAction<CompanyType>) {
      const type = action.payload;
      if (state.filters.company_types.includes(type)) {
        if (state.filters.company_types.length > 1) {
          state.filters.company_types = state.filters.company_types.filter((t) => t !== type);
        }
      } else {
        state.filters.company_types.push(type);
      }
    },
    addSkillFilter(state, action: PayloadAction<string>) {
      const skill = action.payload.trim();
      if (skill && !state.filters.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        state.filters.skills.push(skill);
      }
    },
    removeSkillFilter(state, action: PayloadAction<string>) {
      state.filters.skills = state.filters.skills.filter((s) => s !== action.payload);
    },
    setExperienceRange(state, action: PayloadAction<{ min: number; max: number }>) {
      state.filters.min_years_experience = action.payload.min;
      state.filters.max_years_experience = action.payload.max;
    },
    toggleLocation(state, action: PayloadAction<string>) {
      const loc = action.payload;
      if (state.filters.locations.includes(loc)) {
        if (state.filters.locations.length > 1) {
          state.filters.locations = state.filters.locations.filter((l) => l !== loc);
        }
      } else {
        state.filters.locations.push(loc);
      }
    },
    updateRubricWeight(state, action: PayloadAction<{ criterionId: string; weight: number }>) {
      const crit = state.rubric.criteria.find((c) => c.id === action.payload.criterionId);
      if (crit) {
        crit.weight = action.payload.weight;
      }
    },
    setCandidateFeedback(
      state,
      action: PayloadAction<{ candidateId: string; feedback: 'match' | 'reject' | null }>
    ) {
      const cand = state.candidates.find((c) => c.profile.id === action.payload.candidateId);
      if (cand) {
        cand.feedback = cand.feedback === action.payload.feedback ? null : action.payload.feedback;
      }
    },
    setSelectedCandidate(state, action: PayloadAction<ScoredCandidate | null>) {
      state.selectedCandidate = action.payload;
    },
    unfreezeSearch(state) {
      state.status = 'idle';
      state.freezeData = null;
    },
    resetSearchState(state) {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    // Initial Search
    builder.addCase(runInitialSearch.pending, (state) => {
      state.status = 'searching';
      state.errorMessage = null;
      state.needsClarification = false;
      state.clarificationMessage = null;
      state.suggestedClarifications = [];
    });
    builder.addCase(runInitialSearch.fulfilled, (state, action) => {
      state.status = 'idle';
      state.currentQuery = action.payload.query;
      state.needsClarification = !!action.payload.needsClarification;
      state.clarificationMessage = action.payload.clarificationMessage || null;
      state.suggestedClarifications = action.payload.suggestedClarifications || [];
      state.filters = action.payload.filters;
      state.rubric = action.payload.rubric;
      state.candidates = action.payload.results;
      state.totalPoolCount = action.payload.totalPoolCount;
      state.filteredCount = action.payload.filteredCount;
      state.exactMatchCount = action.payload.exactMatchCount;
      state.activeLlmProvider = action.payload.activeLlmProvider;
      state.refinementCount = 0;
    });
    builder.addCase(runInitialSearch.rejected, (state, action) => {
      state.status = 'error';
      state.errorMessage = (action.payload as string) || 'Search failed';
    });

    // Refinement
    builder.addCase(runRefinement.pending, (state) => {
      state.status = 'refining';
      state.errorMessage = null;
    });
    builder.addCase(runRefinement.fulfilled, (state, action) => {
      state.status = 'idle';
      state.filters = action.payload.filters;
      state.rubric = action.payload.rubric;
      state.candidates = action.payload.results;
      state.totalPoolCount = action.payload.totalPoolCount;
      state.filteredCount = action.payload.filteredCount;
      state.activeLlmProvider = action.payload.activeLlmProvider;
      state.refinementCount += 1;
    });
    builder.addCase(runRefinement.rejected, (state, action) => {
      state.status = 'error';
      state.errorMessage = (action.payload as string) || 'Refinement failed';
    });

    // Re-evaluation
    builder.addCase(reevaluateWithFilters.fulfilled, (state, action) => {
      state.candidates = action.payload.results;
      state.filteredCount = action.payload.filteredCount;
      state.filters = action.payload.filters;
      state.rubric = action.payload.rubric;
    });

    // Freeze Search
    builder.addCase(freezeCurrentSearch.pending, (state) => {
      state.status = 'refining';
    });
    builder.addCase(freezeCurrentSearch.fulfilled, (state, action) => {
      state.status = 'frozen';
      state.freezeData = action.payload;
    });
  },
});

export const {
  setQuery,
  updateFilters,
  toggleCompanyType,
  addSkillFilter,
  removeSkillFilter,
  setExperienceRange,
  toggleLocation,
  updateRubricWeight,
  setCandidateFeedback,
  setSelectedCandidate,
  unfreezeSearch,
  resetSearchState,
} = sourcingSlice.actions;

export default sourcingSlice.reducer;
