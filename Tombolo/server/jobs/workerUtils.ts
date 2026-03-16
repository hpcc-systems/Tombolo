export default (parentPort: any) => ({
  log: (level: string, text: any, error: any = null) =>
    parentPort.postMessage({ level, text, error }), // {level?: info|verbose|error ; text?:any; error?: instanceof Error; }
  dispatch: (action: string, data: any) =>
    parentPort.postMessage({ action, data }), // {action?: scheduleNext|remove; data?:any }
});
