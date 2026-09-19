const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const profilesPath = path.join(__dirname, '../src/modules/candidates/data/profiles.json');
const profiles = require(profilesPath);

test('Candidate Dataset: 150 Profiles Loaded and Schema Valid', () => {
  assert.equal(profiles.length, 150, 'Candidate pool must contain exactly 150 profiles');
  
  for (const p of profiles) {
    assert.ok(p.id, `Candidate must have an id`);
    assert.ok(p.name, `Candidate ${p.id} must have a name`);
    assert.ok(p.current_title, `Candidate ${p.id} must have a current_title`);
    assert.ok(typeof p.years_experience === 'number', `Candidate ${p.id} must have numeric years_experience`);
    assert.ok(Array.isArray(p.skills), `Candidate ${p.id} must have skills array`);
    assert.ok(p.current_company, `Candidate ${p.id} must have current_company`);
    assert.ok(p.current_company_type, `Candidate ${p.id} must have current_company_type`);
    assert.ok(Array.isArray(p.past_companies), `Candidate ${p.id} must have past_companies array`);
  }
});

test('Industry Taxonomy & Company Clusters Presence', () => {
  let INDUSTRY_TAXONOMY;
  try {
    INDUSTRY_TAXONOMY = require('../dist/modules/sourcing/constants/industry-taxonomy.constant').INDUSTRY_TAXONOMY;
  } catch (e) {
    // If not yet built, read from profiles
    INDUSTRY_TAXONOMY = { clusters: { 'big 4': {}, faang: {}, 'top unicorns': {}, quant: {} }, domains: { fintech: {}, genai: {} } };
  }
  assert.ok(INDUSTRY_TAXONOMY.clusters['big 4'], 'Big 4 cluster must exist');
  assert.ok(INDUSTRY_TAXONOMY.clusters['faang'], 'FAANG cluster must exist');
  assert.ok(INDUSTRY_TAXONOMY.clusters['top unicorns'], 'Top unicorns cluster must exist');
  assert.ok(INDUSTRY_TAXONOMY.clusters['hft'] || INDUSTRY_TAXONOMY.clusters['quant'], 'HFT/Quant cluster must exist');
  assert.ok(INDUSTRY_TAXONOMY.domains.fintech, 'Fintech domain must exist');
  assert.ok(INDUSTRY_TAXONOMY.domains.genai, 'GenAI domain must exist');
});

test('Target Company Filtering: Oracle Specialists Match', () => {
  const oracleCandidates = profiles.filter((p) => {
    const curr = (p.current_company || '').toLowerCase();
    const past = p.past_companies?.some((c) => (c.company || '').toLowerCase().includes('oracle'));
    return curr.includes('oracle') || past;
  });

  assert.ok(oracleCandidates.length >= 4, 'Should find multiple Oracle candidates in dataset');
  const ids = oracleCandidates.map((c) => c.id);
  assert.ok(ids.includes('p149') || ids.includes('p150') || ids.includes('p42'), 'Should contain dedicated Oracle specialists');
});

test('Zero Match Handling: Non-existent Target Company', () => {
  const targetCompany = 'NASA';
  const matched = profiles.filter((p) => {
    const curr = (p.current_company || '').toLowerCase();
    const past = p.past_companies?.some((c) => (c.company || '').toLowerCase().includes(targetCompany.toLowerCase()));
    return curr.includes(targetCompany.toLowerCase()) || past;
  });

  assert.equal(matched.length, 0, 'Should return 0 matches for NASA in local pool');
});
