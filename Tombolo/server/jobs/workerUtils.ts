type LogLevel = 'info' | 'verbose' | 'error';
type WorkerAction = 'scheduleNext' | 'remove';

type LogMessage = {
  level: LogLevel;
  text: unknown;
  error: Error | null;
};

type DispatchMessage = {
  action: WorkerAction;
  data: unknown;
};

type WorkerMessage = LogMessage | DispatchMessage;

type ParentPortLike = {
  postMessage: (message: WorkerMessage) => void;
};

type WorkerUtils = {
  log: (level: LogLevel, text: unknown, error?: Error | null) => void;
  dispatch: (action: WorkerAction, data: unknown) => void;
};

export default (parentPort: ParentPortLike): WorkerUtils => ({
  log: (level, text, error = null) =>
    parentPort.postMessage({ level, text, error }), // {level?: info|verbose|error ; text?:any; error?: instanceof Error; }
  dispatch: (action, data) => parentPort.postMessage({ action, data }), // {action?: scheduleNext|remove; data?:any }
});
