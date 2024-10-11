import { authHeader, handleError } from '../../common/AuthHeader.js';

// Update a job monitoring
export const updateAccount = async (values) => {
  const { id } = values;
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(values),
  };

  const response = await fetch(`/api/user/${id}`, payload);

  if (!response.ok) {
    handleError(response);
    throw new Error('Failed to update user');
  }

  const data = await response.json();
  return data;
};

export const updatePassword = async (values) => {
  const { id } = values;
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(values),
  };

  const response = await fetch(`/api/user/changepassword/${id}`, payload);

  if (!response.ok) {
    handleError(response);
    throw new Error('Failed to change password');
  }

  const data = await response.json();
  return data;
};
