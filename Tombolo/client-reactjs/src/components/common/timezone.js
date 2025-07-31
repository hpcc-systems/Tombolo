/* eslint-disable unused-imports/no-unused-vars */
export const getUserStandardTimeZoneAbbreviation = () => {
  const date = new Date();
  const timeZoneOffset = date.getTimezoneOffset();
  const offsetHours = Math.abs(timeZoneOffset) / 60;
  const offsetSign = timeZoneOffset > 0 ? '-' : '+';
  const offsetString = offsetSign + ('0' + offsetHours).slice(-2) + ':00'; // Format the offset string
  // Construct the time zone abbreviation
  return 'GMT' + offsetString;
};
