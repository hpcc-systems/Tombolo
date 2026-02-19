const convertToISODateString = (string: string): string => {
  const regx = new RegExp(/[^0-9]/g);
  let dateString = string.replace(regx, '');
  dateString = (parseInt(dateString) + 1).toString(); // Adds 1 second. remove this conditionally if you want accurate conversion
  const year = parseInt(dateString.slice(0, 4), 10);
  const month = parseInt(dateString.slice(4, 6), 10) - 1;
  const day = parseInt(dateString.slice(6, 8), 10);
  const hour = parseInt(dateString.slice(8, 10), 10);
  const minute = parseInt(dateString.slice(10, 12), 10);
  const second = parseInt(dateString.slice(12, 14), 10);
  const isoString = new Date(
    Date.UTC(year, month, day, hour, minute, second)
  ).toISOString();
  return isoString;
};

export default convertToISODateString;

// Tests
console.log(convertToISODateString('2023-09-15T12:30:45Z')); // Expected output: '2023-09-15T12:30:46.000Z'
console.log(convertToISODateString('2023/09/15 12:30:45')); // Expected output: '2023-09-15T12:30:46.000Z'
console.log(convertToISODateString('20230915123045')); // Expected output: '2023-09-15T12:30:46.000Z'
