import { authHeader } from '../../common/AuthHeader.js';

// Create a new user
const createUser = async (newUserData) => {
  const payload = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(newUserData),
  };

  const response = await fetch('/api/user', payload);

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  const jsonResponse = await response.json();
  return jsonResponse.data;
};

// Get all users - using fetch make a get request to the server to get all users
const getAllUsers = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch('/api/user', payload);

  // Check if the response is ok
  if (!response.ok) {
    throw new Error('Failed to get users');
  }

  // Get the data from the response
  const jsonResponse = await response.json();
  const allUsers = jsonResponse.data;

  return allUsers;
};

// Update a user
const updateUser = async ({ userId, updatedUser }) => {
  const payload = {
    method: 'PATCH',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedUser),
  };

  const response = await fetch(`/api/user/${userId}`, payload);

  if (!response.ok) {
    throw new Error('Failed to update user');
  }

  const jsonResponse = await response.json();
  return jsonResponse.data;
};

// Delete a user by ID
const deleteUser = async ({ id }) => {
  const payload = {
    method: 'DELETE',
    headers: authHeader(),
  };

  const response = await fetch(`/api/user/${id}`, payload);

  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
};

// Get all available roles
const getAllRoles = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch('/api/roles', payload);

  if (!response.ok) {
    throw new Error('Failed to get roles');
  }

  const jsonResponse = await response.json();
  return jsonResponse.data;
};

//Get all applications
const getAllApplications = async () => {
  // /api/app/read/app_list
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch('/api/app/read/app_list', payload);

  if (!response.ok) {
    throw new Error('Failed to get applications');
  }

  const jsonResponse = await response.json();

  return jsonResponse;
};

// Update user roles
const updateUserRoles = async ({ userId, roles }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ roles }),
  };

  const response = await fetch(`/api/user/roles/update/${userId}`, payload);

  if (!response.ok) {
    throw new Error('Failed to update user roles');
  }
};

// Update user applications
const updateUserApplications = async ({ userId, applications }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ applications }),
  };

  const response = await fetch(`/api/user/applications/${userId}`, payload);

  if (!response.ok) {
    throw new Error('Failed to update user applications');
  }

  //return response.json();
  const responseObj = await response.json();

  return responseObj.data;
};

// Bulk Delete users - send array of user IDs to /api/user/bulk-delete
const bulkDeleteUsers = async ({ ids }) => {
  const payload = {
    method: 'DELETE',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  };

  const response = await fetch('/api/user/bulk-delete', payload);

  if (!response.ok) {
    throw new Error('Failed to delete users');
  }
};

export {
  createUser,
  getAllUsers,
  deleteUser,
  updateUser,
  getAllRoles,
  getAllApplications,
  updateUserRoles,
  updateUserApplications,
  bulkDeleteUsers,
};
