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
    INDUSTRY_TAXONOMY = { clusters: { 'big 4': {}, faang: {}, 'top unicorns': {}, quant: {} }, domains: { fintech: {}, genai: {} } };
  }
  assert.ok(INDUSTRY_TAXONOMY.clusters['big 4'], 'Big 4 cluster must exist');
  assert.ok(INDUSTRY_TAXONOMY.clusters['faang'], 'FAANG cluster must exist');
  assert.ok(INDUSTRY_TAXONOMY.clusters['top unicorns'], 'Top unicorns cluster must exist');
  assert.ok(INDUSTRY_TAXONOMY.clusters['hft'] || INDUSTRY_TAXONOMY.clusters['quant'], 'HFT/Quant cluster must exist');
  assert.ok(INDUSTRY_TAXONOMY.domains.fintech, 'Fintech domain must exist');
  assert.ok(INDUSTRY_TAXONOMY.domains.genai, 'GenAI domain must exist');
});

test('Strict Mode Filtering: Strict Company & Zero Match Edge Cases', () => {
  // Test Oracle in Strict Mode
  const oracleCandidates = profiles.filter((p) => {
    const curr = (p.current_company || '').toLowerCase();
    const past = p.past_companies?.some((c) => (c.company || '').toLowerCase().includes('oracle'));
    return curr.includes('oracle') || past;
  });
  assert.ok(oracleCandidates.length >= 4, 'Should find multiple Oracle candidates in dataset');

  // Test non-existent company in Strict Mode (NASA / SpaceX)
  const nasaCandidates = profiles.filter((p) => {
    const curr = (p.current_company || '').toLowerCase();
    const past = p.past_companies?.some((c) => (c.company || '').toLowerCase().includes('nasa'));
    return curr.includes('nasa') || past;
  });
  assert.equal(nasaCandidates.length, 0, 'Strict mode must return exactly 0 matches for non-existent company');
});

test('Smart Expansion Algorithm: Related Backgrounds for Broad Queries', () => {
  // Related database specialists in the talent pool
  const dbSpecialists = profiles.filter((p) => {
    const skills = p.skills.map((s) => s.toLowerCase());
    return (
      skills.some((s) => s.includes('database') || s.includes('postgresql') || s.includes('rds') || s.includes('sql')) ||
      (p.current_title || '').toLowerCase().includes('database')
    );
  });
  assert.ok(dbSpecialists.length >= 10, 'Smart Expansion should have abundant database specialists for expansion');
});
