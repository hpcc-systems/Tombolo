/**
 * Normalizes a label by replacing newlines and multiple spaces, then shortens using readableLabels if matched
 * @param label
 */
export function normalizeLabel(label: string): string;

/**
 * Mapping of normalized label prefixes to readable short labels
 */
export declare const readableLabels: Record<string, string>;

/**
 * Lookup for WUDetails metric units
 */
export declare const UNIT_LOOKUP: Record<
  string,
  'nanoseconds' | 'percentage' | 'bytes' | 'int'
>;

/**
 * Lookup for WUDetails metric format functions
 */
export declare const FORMAT_LOOKUP: Record<string, Function>;

/**
 * List of all relevant metrics for workunit details
 */
export declare const relevantMetrics: string[];

export declare const forbiddenSqlKeywords: string[];

export declare const TERMINAL_STATES: string[];