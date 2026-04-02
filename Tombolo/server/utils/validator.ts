interface ValidationError {
  location?: string;
  msg?: string;
  param?: string;
  _value?: unknown;
  _nestedErrors?: ValidationError[];
}

export default ({
  location,
  msg,
  param,
  _value,
  _nestedErrors,
}: ValidationError) => {
  return `${location}[${param}]: ${msg}`;
};
