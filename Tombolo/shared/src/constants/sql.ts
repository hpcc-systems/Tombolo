const forbiddenSqlKeywords = [
  'insert',
  'update',
  'delete',
  'drop',
  'alter',
  'truncate',
  'create',
  'replace',
  'grant',
  'revoke',
  'rename', // RENAME TABLE
  'load', // LOAD DATA INFILE
  'set', // SET (session variables)
  'call', // CALL (stored procedures)
  'execute', // EXECUTE (prepared statements)
  'commit',
  'rollback',
  'start', // START TRANSACTION
  'begin', // BEGIN
  'handler', // HANDLER statements
  'optimize', // OPTIMIZE TABLE
  'repair', // REPAIR TABLE
  'analyze', // ANALYZE TABLE
  'check', // CHECK TABLE
  'checksum', // CHECKSUM TABLE
  'flush', // FLUSH (logs, privileges, etc.)
  'kill', // KILL (connections/queries)
  'reset', // RESET QUERY CACHE, etc.
  'purge', // PURGE BINARY LOGS
  'cache', // CACHE INDEX (older syntax)
  'shutdown', // SHUTDOWN
  'install', // INSTALL PLUGIN
  'uninstall', // UNINSTALL PLUGIN
  'binlog', // BINLOG (rare, but admin)
  'get', // GET DIAGNOSTICS (can be used in procedures)
  'signal', // SIGNAL/RESIGNAL (error handling in procedures)
  'resignal',
];

export { forbiddenSqlKeywords };
