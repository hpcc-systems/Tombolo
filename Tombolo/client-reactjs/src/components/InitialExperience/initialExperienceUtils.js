import { authHeader } from '../common/AuthHeader.js';

//Complete set up
export const completeFirstRun = async ({ instanceInfo }) => {
  const payload = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(instanceInfo),
  };

  const response = await fetch(`/api/wizard/firstRun`, payload);
  return response;
};
