interface ValidationError {
  location?: string;
  msg?: string;
  param?: string;
  value?: any;
  nestedErrors?: ValidationError[];
}

export default ({
  location,
  msg,
  param,
  value,
  nestedErrors,
}: ValidationError) => {
  return `${location}[${param}]: ${msg}`;
};
