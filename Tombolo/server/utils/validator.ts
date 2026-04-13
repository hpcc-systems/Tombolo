import { ErrorFormatter } from 'express-validator';

const errorFormatter: ErrorFormatter<string> = error => {
  // Field errors include location and path; other variants do not.
  if ('path' in error) {
    return `${error.location}[${error.path}]: ${error.msg}`;
  }

  return String(error.msg);
};

export default errorFormatter;
