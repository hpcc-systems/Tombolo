import levenshtein from 'fast-levenshtein';

export interface FuzzyMatchOptions {
  minSimilarity?: number;
  minSubstringLength?: number;
  maxSubstringLength?: number;
}

export interface FuzzyMatchResult<T = unknown> {
  item: T;
  similarity: number;
  distance: number;
  matchType: 'exact' | 'substring' | 'fuzzy';
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\d\W]+/g, ' ')
    .trim()
    .replace(/\s+/g, ''); // Remove all spaces after normalization
}

function generateSubstrings(
  str: string,
  minLen: number = 3,
  maxLen: number = 5
): string[] {
  const substrings: string[] = [];
  for (let len = minLen; len <= Math.min(maxLen, str.length); len++) {
    for (let i = 0; i <= str.length - len; i++) {
      substrings.push(str.substring(i, i + len));
    }
  }
  return substrings;
}

export function getSimilarityWithSubstringBonus(
  str1: string,
  str2: string,
  options: FuzzyMatchOptions = {}
): {
  similarity: number;
  matchType: 'exact' | 'substring' | 'fuzzy';
} {
  const { minSubstringLength = 5, maxSubstringLength = 8 } = options;
  const norm1 = normalize(str1);
  const norm2 = normalize(str2);

  // Guard against empty normalized strings (prevents NaN from division by 0)
  if (norm1.length === 0) {
    return {
      similarity: norm2.length === 0 ? 1 : 0,
      matchType: norm2.length === 0 ? 'exact' : 'fuzzy',
    };
  }

  // Tier 1: Exact match (100%)
  if (norm1 === norm2) {
    return { similarity: 1.0, matchType: 'exact' };
  }

  // Tier 2: Full substring match with minimum length (90%)
  if (norm2.includes(norm1) && norm1.length >= minSubstringLength) {
    // Search term is contained in compared word
    return { similarity: 0.9, matchType: 'substring' };
  }
  if (norm1.includes(norm2) && norm2.length >= minSubstringLength) {
    // Compared word is contained in search term
    return { similarity: 0.9, matchType: 'substring' };
  }

  // Tier 3: Check for configurable character substring match (~90%)
  // Only return high similarity if the substring is significant relative to string length
  const SUBSTRING_THRESHOLD = 0.4;
  if (norm1.length >= minSubstringLength) {
    const minStringLength = Math.min(norm1.length, norm2.length);
    if (minStringLength === 0) return 0;
    for (
      let len = Math.min(norm1.length, maxSubstringLength);
      len >= minSubstringLength;
      len--
    ) {
      for (let i = 0; i <= norm1.length - len; i++) {
        const sub = norm1.substring(i, i + len);
        if (norm2.includes(sub)) {
          // Only consider it a strong match if the substring is a significant portion
          // Require substring to be at least 40% of the shorter string
          const substringRatio = len / minStringLength;
          if (substringRatio >= 0.4) {
            return { similarity: 0.9, matchType: 'substring' };
          }
          // If substring is smaller, continue checking for longer matches
          // but don't return immediately
        }
      }
    }
  }

  // Tier 4: Calculate fuzzy match with bonuses
  // Only check smaller substrings if longer match failed
  const substrings = generateSubstrings(
    norm1,
    minSubstringLength,
    minSubstringLength
  );

  // Check if any substring is in the compared word
  let substringMatch = false;
  for (const sub of substrings) {
    if (norm2.includes(sub)) {
      substringMatch = true;
      break;
    }
  }

  // Calculate base Levenshtein similarity
  const distance = levenshtein.get(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return { similarity: 1, matchType: 'exact' };
  const baseSim = 1 - distance / maxLen;

  // Bonus for consecutive characters
  let consecutiveCount = 0;
  let maxConsecutive = 0;
  let j = 0;

  for (let i = 0; i < norm2.length && j < norm1.length; i++) {
    if (norm2[i] === norm1[j]) {
      consecutiveCount++;
      j++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    } else {
      consecutiveCount = 0;
    }
  }

  const consecutiveBonus = maxConsecutive / norm1.length;

  // If substring match found, boost the score
  if (substringMatch) {
    const similarity = Math.min(
      1.0,
      Math.max(
        baseSim * 0.5 + consecutiveBonus * 0.3 + 0.2,
        baseSim * 0.6 + consecutiveBonus * 0.4 + 0.15
      )
    );
    return { similarity, matchType: 'substring' };
  }

  // Combine base similarity with consecutive bonus (weighted average)
  const similarity = Math.min(1.0, baseSim * 0.6 + consecutiveBonus * 0.4);
  return { similarity, matchType: 'fuzzy' };
}

export function findFuzzyMatches<T>(
  searchTerm: string,
  items: T[],
  getSearchField: (item: T) => string,
  options: FuzzyMatchOptions = {}
): FuzzyMatchResult<T>[] {
  const { minSimilarity = 0.8 } = options;

  // Cache field values to avoid duplicate getSearchField calls
  const itemsWithFields = items
    .map(item => ({
      item,
      fieldValue: getSearchField(item),
    }))
    .filter(({ fieldValue }) => fieldValue); // Filter out items without the field

  const norm1 = normalize(searchTerm);

  const results: FuzzyMatchResult<T>[] = itemsWithFields
    .map(({ item, fieldValue }) => {
      const { similarity, matchType } = getSimilarityWithSubstringBonus(
        searchTerm,
        fieldValue,
        options
      );
      const norm2 = normalize(fieldValue);

      return {
        item,
        similarity, // Keep raw similarity for filtering
        distance: levenshtein.get(norm1, norm2),
        matchType,
      };
    })
    .filter(result => result.similarity >= minSimilarity) // Filter with raw similarity
    .map(result => ({
      ...result,
      similarity: Math.round(result.similarity * 100) / 100, // Round for presentation
    }))
    .sort((a, b) => b.similarity - a.similarity); // Sort by similarity descending

  return results;
}

export function fuzzyScore(
  str1: string,
  str2: string,
  options: FuzzyMatchOptions = {}
): number {
  return getSimilarityWithSubstringBonus(str1, str2, options).similarity;
}
