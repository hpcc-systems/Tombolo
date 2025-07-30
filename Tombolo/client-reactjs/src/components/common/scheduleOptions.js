const daysOfWeek = [
  { label: 'Monday', shortLabel: 'Mon', value: '1' },
  { label: 'Tuesday', shortLabel: 'Tue', value: '2' },
  { label: 'Wednesday', shortLabel: 'Wed', value: '3' },
  { label: 'Thursday', shortLabel: 'Thurs', value: '4' },
  { label: 'Friday', shortLabel: 'Fri', value: '5' },
  { label: 'Saturday', shortLabel: 'Sat', value: '6' },
  { label: 'Sunday', shortLabel: 'Sun', value: '0' },
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
const daysOfMonth = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  const label =
    day +
    (day % 10 === 1 && day % 100 !== 11
      ? 'st'
      : day % 10 === 2 && day % 100 !== 12
      ? 'nd'
      : day % 10 === 3 && day % 100 !== 13
      ? 'rd'
      : 'th');
  return { label, value: day };
});

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

export { daysOfWeek, weeks, months, daysOfMonth, getDayLabel, getMonthLabel, getDateLabel, getWeekLabel };
