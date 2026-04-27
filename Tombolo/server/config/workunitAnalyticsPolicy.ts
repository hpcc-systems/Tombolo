export const ALLOWED_WORKUNIT_ANALYTICS_TABLES = [
  'work_unit_details',
  'work_units',
  'clusters',
  'work_unit_exceptions',
  'work_unit_files',
];

export const ALLOWED_WORKUNIT_ANALYTICS_TABLE_SET = new Set(
  ALLOWED_WORKUNIT_ANALYTICS_TABLES
);

export const SENSITIVE_WORKUNIT_ANALYTICS_CLUSTER_COLUMNS = [
  'username',
  'hash',
  'password',
  'password_hash',
];

export const SENSITIVE_WORKUNIT_ANALYTICS_CLUSTER_COLUMN_SET = new Set(
  SENSITIVE_WORKUNIT_ANALYTICS_CLUSTER_COLUMNS
);

export const WORKUNIT_ANALYTICS_SCOPE_VALUE_REGEX = /^[A-Za-z0-9_.:-]+$/;
