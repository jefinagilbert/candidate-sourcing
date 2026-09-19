export const APP_CONFIG = {
  appName: 'Flexiple AI Recruiter',
  appTagline: 'The Autonomous Sourcing Refinement Loop',
  version: '2.0.0',
  defaultApiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  companyTypes: [
    { value: 'startup', label: 'Startup', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { value: 'scaleup', label: 'Scaleup', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
    { value: 'enterprise', label: 'Enterprise', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { value: 'agency', label: 'Agency', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  ],
  locations: ['Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi NCR', 'Remote'],
};
