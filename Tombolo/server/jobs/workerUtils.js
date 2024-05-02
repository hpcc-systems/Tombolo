module.exports = (parentPort) => ({
  log: (level, text, error = null) => parentPort.postMessage({ level, text, error }), // {level?: info|verbose|error ; text?:any; error?: instanceof Error; }
  dispatch: (action, data) => parentPort.postMessage({ action, data }), // {action?: scheduleNext|remove; data?:any }
});
