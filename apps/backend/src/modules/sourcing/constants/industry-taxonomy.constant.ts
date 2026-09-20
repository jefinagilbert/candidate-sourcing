/**
 * Centralized Industry Knowledge & Company Taxonomy.
 * Provides accessible semantic definitions for industry groups, company tiers, and domains.
 */
export const INDUSTRY_TAXONOMY = {
  // Umbrella Company Tiers & Clusters
  clusters: {
    'big 4': {
      label: 'Big 4 & Top Consultancies',
      companies: ['Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture'],
      company_types: ['agency', 'enterprise'],
      keywords: ['Consulting', 'Big 4', 'Advisory'],
    },
    'big4': {
      label: 'Big 4 & Top Consultancies',
      companies: ['Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture'],
      company_types: ['agency', 'enterprise'],
      keywords: ['Consulting', 'Big 4', 'Advisory'],
    },
    'strategy consultancies': {
      label: 'MBB Strategy Consultancies',
      companies: ['McKinsey Digital', 'BCG Platinion', 'Bain & Company'],
      company_types: ['enterprise'],
      keywords: ['Management Consulting', 'Strategy', 'Digital Transformation'],
    },
    'faang': {
      label: 'Big Tech / FAANG',
      companies: ['Meta', 'Apple', 'Amazon', 'Netflix', 'Google', 'Microsoft'],
      company_types: ['enterprise'],
      keywords: ['Big Tech', 'Hyperscale'],
    },
    'mamaa': {
      label: 'MAMAA Big Tech',
      companies: ['Meta', 'Apple', 'Microsoft', 'Amazon', 'Alphabet'],
      company_types: ['enterprise'],
      keywords: ['Big Tech', 'Hyperscale'],
    },
    'indian it': {
      label: 'Indian IT Services & MNCs',
      companies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'HCL', 'Tech Mahindra'],
      company_types: ['enterprise', 'agency'],
      keywords: ['IT Services', 'Enterprise Tech'],
    },
    'top unicorns': {
      label: 'Indian Unicorns & Scaleups',
      companies: ['Razorpay', 'Swiggy', 'Flipkart', 'Postman', 'Chargebee', 'Hasura', 'BrowserStack', 'CRED', 'Groww', 'Zepto', 'Meesho', 'Nykaa', 'Blinkit', 'Dream11', 'Innovaccer', 'PharmEasy', 'PhysicsWallah'],
      company_types: ['scaleup'],
      keywords: ['Unicorn', 'Scaleup', 'Product Tech'],
    },
    'hft': {
      label: 'High-Frequency Trading & Quant Firms',
      companies: ['Citadel', 'Jane Street', 'Tower Research Capital', 'Graviton Research Capital', 'Goldman Sachs', 'Morgan Stanley'],
      company_types: ['startup', 'enterprise'],
      keywords: ['HFT', 'Quant', 'Trading', 'Low Latency'],
    },
    'quant': {
      label: 'High-Frequency Trading & Quant Firms',
      companies: ['Citadel', 'Jane Street', 'Tower Research Capital', 'Graviton Research Capital', 'Goldman Sachs', 'Morgan Stanley'],
      company_types: ['startup', 'enterprise'],
      keywords: ['HFT', 'Quant', 'Trading', 'Low Latency'],
    },
    'gaming': {
      label: 'Gaming & Real-time Entertainment',
      companies: ['Dream11', 'Mobile Premier League (MPL)', 'Nazara Technologies', 'Krafton', 'EA Sports (Electronic Arts)', 'Ubisoft'],
      company_types: ['scaleup', 'enterprise'],
      keywords: ['Gaming', 'Multiplayer', 'Game Engine', 'Real-time'],
    },
    'quick commerce': {
      label: 'Quick Commerce & Dark Store Delivery',
      companies: ['Zepto', 'Blinkit', 'Swiggy Instamart', 'Swiggy', 'Zomato'],
      company_types: ['scaleup'],
      keywords: ['Quick Commerce', '10-minute delivery', 'Logistics', 'Dark store'],
    },
    'qcommerce': {
      label: 'Quick Commerce & Dark Store Delivery',
      companies: ['Zepto', 'Blinkit', 'Swiggy Instamart', 'Swiggy', 'Zomato'],
      company_types: ['scaleup'],
      keywords: ['Quick Commerce', '10-minute delivery', 'Logistics', 'Dark store'],
    },
    'genai': {
      label: 'Generative AI & Deep Tech',
      companies: ['Sarvam AI', 'Krutrim', 'Microsoft Research', 'NVIDIA', 'OpenAI', 'Databricks'],
      company_types: ['startup', 'enterprise'],
      keywords: ['GenAI', 'LLM', 'Transformers', 'Deep Learning'],
    },
    'ai research': {
      label: 'Generative AI & Deep Tech',
      companies: ['Sarvam AI', 'Krutrim', 'Microsoft Research', 'NVIDIA', 'OpenAI', 'Databricks'],
      company_types: ['startup', 'enterprise'],
      keywords: ['GenAI', 'LLM', 'Transformers', 'Deep Learning'],
    },
    'healthtech': {
      label: 'Healthcare & Biotech',
      companies: ['Innovaccer', 'Practo', 'Tata 1mg', '1mg (Tata 1mg)', 'PharmEasy', 'Cure.fit (Cult.fit)'],
      company_types: ['scaleup'],
      keywords: ['Healthtech', 'Telemedicine', 'FHIR', 'Healthcare'],
    },
    'edtech': {
      label: 'Educational Technology',
      companies: ['PhysicsWallah', 'Unacademy', 'BYJU\'S', 'Eruditus Executive Education', 'Coursera'],
      company_types: ['scaleup', 'enterprise'],
      keywords: ['EdTech', 'Interactive Learning', 'LMS'],
    },
    'cybersecurity': {
      label: 'Cybersecurity & Cloud Defense',
      companies: ['Zscaler', 'Palo Alto Networks', 'CRED', 'Razorpay', 'Quick Heal'],
      company_types: ['enterprise', 'scaleup'],
      keywords: ['Security', 'Zero Trust', 'AppSec', 'Penetration Testing'],
    },
    'oracle ecosystem': {
      label: 'Oracle Ecosystem',
      companies: ['Oracle Corporation', 'Oracle', 'Sun Microsystems'],
      company_types: ['enterprise'],
      keywords: ['Oracle', 'OCI', 'Exadata', 'Autonomous DB'],
    },
  },

  // Functional Domains
  domains: {
    fintech: ['Payments', 'Banking', 'Lending', 'Ledger', 'UPI', 'Finance', 'Billing', 'Trading', 'HFT', 'Double-Entry'],
    healthtech: ['Health', 'Medical', 'Diagnostics', 'Pharma', 'Telemedicine', 'FHIR', 'HIPAA'],
    edtech: ['EdTech', 'Live Class', 'LMS', 'Video Streaming', 'Cohort'],
    gaming: ['Gaming', 'Multiplayer', 'Leaderboard', 'Unreal Engine', 'Unity', 'Shaders'],
    quickcommerce: ['Quick Commerce', 'Dark Store', 'Dispatch', 'Routing', 'Fulfillment'],
    ecommerce: ['E-Commerce', 'Checkout', 'Catalog', 'Elasticsearch', 'Cart'],
    genai: ['LLM', 'Transformers', 'vLLM', 'LangChain', 'CUDA', 'LoRA', 'Diffusion'],
    saas: ['B2B', 'SaaS', 'Cloud', 'API', 'Platform', 'CRM', 'ERP'],
    devtools: ['Developer Tools', 'Infrastructure', 'Observability', 'CI/CD', 'Telemetry', 'eBPF'],
    security: ['Cybersecurity', 'Zero Trust', 'AppSec', 'OWASP', 'IAM', 'Vault', 'SOC2'],
    hardware: ['Semiconductor', 'Firmware', 'CUDA', 'AUTOSAR', 'Embedded', 'VLSI', 'RTOS'],
  },

  // Target Institute Tiers
  pedigree: {
    tier1: ['IIT', 'BITS', 'NIT', 'IIIT', 'Stanford', 'MIT', 'Berkeley', 'Harvard', 'IISc', 'CMU', 'DTU', 'VJTI', 'COEP'],
  },
};

/**
 * Resolves related companies, sibling cluster members, or similar domain companies.
 */
export function getRelatedCompaniesAndKeywords(targetCompany: string): { relatedCompanies: string[]; domainKeywords: string[] } {
  const norm = targetCompany.toLowerCase().trim();
  const relatedCompanies = new Set<string>();
  const domainKeywords = new Set<string>();

  for (const [key, cluster] of Object.entries(INDUSTRY_TAXONOMY.clusters)) {
    const hasCompany = cluster.companies.some(c => c.toLowerCase().includes(norm) || norm.includes(c.toLowerCase()));
    if (hasCompany || key.includes(norm) || norm.includes(key)) {
      cluster.companies.forEach(c => relatedCompanies.add(c));
      cluster.keywords.forEach(k => domainKeywords.add(k));
    }
  }

  return {
    relatedCompanies: Array.from(relatedCompanies),
    domainKeywords: Array.from(domainKeywords),
  };
}

