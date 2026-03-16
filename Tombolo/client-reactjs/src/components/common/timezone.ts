/* eslint-disable unused-imports/no-unused-vars */
export const getUserStandardTimeZoneAbbreviation = (): string => {
  const date = new Date();
  const timeZoneOffset = date.getTimezoneOffset();
  const offsetHours = Math.abs(timeZoneOffset) / 60;
  const offsetSign = timeZoneOffset > 0 ? '-' : '+';
  const offsetString = offsetSign + ('0' + offsetHours).slice(-2) + ':00';
  return 'GMT' + offsetString;
};
