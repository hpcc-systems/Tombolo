import { authHeader } from '../../common/AuthHeader.js';

// Get the instance settings
const fetchInstanceSettings = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch('/api/instanceSettings', payload);

  if (response.status !== 200) {
    throw new Error('Failed to get instance settings');
  }

  const data = await response.json();

  return data;
};

// Update  instance settings
const updateInstanceSettings = async (settings) => {
  const payload = {
    method: 'PUT',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  };
  const response = await fetch('/api/instanceSettings', payload);

  if (response.status !== 200) {
    throw new Error('Failed to update instance settings');
  }
  const responseData = await response.json();
  return responseData;
};

export { fetchInstanceSettings, updateInstanceSettings };
