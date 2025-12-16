/**
 * Normalizes a label by replacing newlines and multiple spaces, then shortens using readableLabels if matched
 * @param label
 */
export function normalizeLabel(label: string): string;

/**
 * Mapping of normalized label prefixes to readable short labels
 */
export declare const readableLabels: Object<string, string>;

/**
 * Lookup for WUDetails metric units
 */
export declare const UNIT_LOOKUP: Object<
  string,
  'nanoseconds' | 'percentage' | 'bytes' | 'int'
>;

/**
 * Lookup for WUDetails metric format functions
 */
export declare const FORMAT_LOOKUP: Object<string, function>;

/**
 * List of all relevant metrics for workunit details
 */
export declare const relevantMetrics: string[];

export declare const forbiddenSqlKeywords: string[];