/**
 * Robust JSON parser and extractor that cleans Markdown code fences,
 * fixes common JSON formatting issues, and extracts JSON objects/arrays.
 */
export function safeParseJson<T>(rawText: string, fallback?: T): T {
  if (!rawText) {
    if (fallback !== undefined) return fallback;
    throw new Error('Empty response received from LLM');
  }

  // 1. Remove markdown code blocks if present
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  cleaned = cleaned.trim();

  // 2. Try direct JSON parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    // Continue to advanced extraction
  }

  // 3. Find outermost JSON brackets { ... } or [ ... ]
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  let candidate = '';
  if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    candidate = cleaned.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    candidate = cleaned.substring(firstBracket, lastBracket + 1);
  }

  if (candidate) {
    try {
      return JSON.parse(candidate) as T;
    } catch (err) {
      // 4. Try removing trailing commas
      const fixedTrailingCommas = candidate
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      try {
        return JSON.parse(fixedTrailingCommas) as T;
      } catch (innerErr) {
        // Continue to fallback
      }
    }
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Failed to parse structured JSON from LLM response: ${rawText.slice(0, 200)}...`);
}
