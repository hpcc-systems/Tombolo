type LabelValue = { label: string; value: string | number; shortLabel?: string };

export const daysOfWeek: LabelValue[] = [
  { label: 'Monday', shortLabel: 'Mon', value: '1' },
  { label: 'Tuesday', shortLabel: 'Tue', value: '2' },
  { label: 'Wednesday', shortLabel: 'Wed', value: '3' },
  { label: 'Thursday', shortLabel: 'Thurs', value: '4' },
  { label: 'Friday', shortLabel: 'Fri', value: '5' },
  { label: 'Saturday', shortLabel: 'Sat', value: '6' },
  { label: 'Sunday', shortLabel: 'Sun', value: '0' },
];

export const weeks = [
  { label: 'First', value: 1 },
  { label: 'Second', value: 2 },
  { label: 'Third', value: 3 },
  { label: 'Fourth', value: 4 },
  { label: 'Last', value: 5 },
];

export const months: LabelValue[] = [
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

export const daysOfMonth = Array.from({ length: 31 }, (_, i) => {
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

export const getDayLabel = (value: string) => {
  const day = daysOfWeek.find(d => d.value === value);
  return day?.label;
};

export const getWeekLabel = (value: number) => {
  const week = weeks.find(d => d.value === value);
  return week?.label;
};

export const getMonthLabel = (value: string) => {
  const date = months.find(d => d.value === value);
  return date?.label;
};

export const getDateLabel = (value: number) => {
  const date = daysOfMonth.find(d => d.value === value);
  return date?.label;
};
