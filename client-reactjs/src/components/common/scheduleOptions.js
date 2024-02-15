const daysOfWeek = [
  { label: 'Monday', value: '1' },
  { label: 'Tuesday', value: '2' },
  { label: 'Wednesday', value: '3' },
  { label: 'Thursday', value: '4' },
  { label: 'Friday', value: '5' },
  { label: 'Saturday', value: '6' },
  { label: 'Sunday', value: '0' },
];

const weeks = [
  { label: 'First', value: 1 },
  { label: 'Second', value: 2 },
  { label: 'Third', value: 3 },
  { label: 'Fourth', value: 4 },
  { label: 'Last', value: 5 },
];

const months = [
  { label: 'January', value: '0' },
  { label: 'February', value: '1' },
  { label: 'March', value: '2' },
  { label: 'April', value: '3' },
  { label: 'May', value: '4' },
  { label: 'June', value: '5' },
  { label: 'July', value: '6' },
  { label: 'August', value: '7' },
  { label: 'September', value: '8' },
  { label: 'October', value: '9' },
  { label: 'November', value: '10' },
  { label: 'December', value: '11' },
];

// Days 1 thur 31
const daysOfMonth = [];

for (let i = 1; i <= 31; i++) {
  let label =
    i +
    (i % 10 === 1 && i % 100 !== 11
      ? 'st'
      : i % 10 === 2 && i % 100 !== 12
      ? 'nd'
      : i % 10 === 3 && i % 100 !== 13
      ? 'rd'
      : 'th');

  daysOfMonth.push({ label, value: i });
}
// Get day label from value
const getDayLabel = (value) => {
  const day = daysOfWeek.find((d) => d.value === value);
  return day.label;
};

// Get day label from value
const getWeekLabel = (value) => {
  const week = weeks.find((d) => d.value === value);
  return week.label;
};

// Get month label from value
const getMonthLabel = (value) => {
  const date = months.find((d) => d.value === value);
  return date.label;
};

// Get date label from value
const getDateLabel = (value) => {
  const date = daysOfMonth.find((d) => d.value === value);
  return date.label;
};

module.exports = { daysOfWeek, weeks, months, daysOfMonth, getDayLabel, getMonthLabel, getDateLabel, getWeekLabel };
