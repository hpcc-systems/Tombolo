const convertToISODateString = string => {
  const regx = new RegExp(/[^0-9]/g);
  let dateString = string.replace(regx, '');
  dateString = (parseInt(dateString) + 1).toString(); // Adds 1 second. remove this conditionally if you want accurate conversion
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6) - 1; // subtract 1 to convert from 1-based to 0-based month index
  const day = dateString.slice(6, 8);
  const hour = dateString.slice(8, 10);
  const minute = dateString.slice(10, 12);
  const second = dateString.slice(12, 14);
  const isoString = new Date(
    Date.UTC(year, month, day, hour, minute, second)
  ).toISOString();
  return isoString;
};

export default convertToISODateString;
