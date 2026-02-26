export const DescriptionFormRules = [
  { required: true, message: 'Please enter a description' },
  { min: 10, message: 'Description must be at least 10 characters' },
  { max: 150, message: 'Max character limit is 150' },
];

export const MonitoringNameFormRules = [
  { required: true, message: 'Please enter a monitoring name' },
  { max: 100, message: 'Maximum of 100 characters allowed' },
];

export const InstanceNameFormRules = [
  { min: 5, message: 'Instance name must be at least 5 characters' },
  { required: true, message: 'Please enter your instance name' },
  { max: 64, message: 'Maximum of 64 characters allowed' },
];
