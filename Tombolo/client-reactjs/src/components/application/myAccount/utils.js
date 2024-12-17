import { authHeader, handleError } from '../../common/AuthHeader';
import { setUser, getUser } from '../../common/userStorage';

export const changeBasicUserPassword = async (values) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(values),
  };

  //get user from local storage
  const user = getUser();

  const response = await fetch(`/api/user/change-password/${user?.id}`, payload);
  if (!response.ok) {
    handleError(response);
    return null;
  }

  const data = await response.json();

  return data;
};

export const changeBasicUserInfo = async (values) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(values),
  };

  //get user from local storage
  const user = getUser();

  const response = await fetch(`/api/user/update/${user?.id}`, payload);
  if (!response.ok) {
    handleError(response);
    return null;
  }

  const data = await response.json();

  if (data) {
    //update user in local storage
    setUser(JSON.stringify(data));
  }

  return data;
};

export const applicationStringBuilder = (applications = []) => {
  let applicationString = '';
  applications.forEach((application, index) => {
    applicationString += application.application.title;
    if (index < applications.length - 1) {
      applicationString += ', ';
    }
  });

  return applicationString;
};

export const roleStringBuilder = (roles = []) => {
  let roleString = '';
  roles.forEach((role, index) => {
    roleString += role.role_details.roleName;
    if (index < roles.length - 1) {
      roleString += ', ';
    }
  });
  return roleString;
};

export const getSessions = async (user) => {
  const { id } = user;
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/session/getActiveSessions/${id}`, payload);
  if (!response.ok) {
    handleError(response);
    return null;
  }

  const data = await response.json();

  return data;
};

export const deviceInfoStringBuilder = (deviceInfo) => {
  if (!deviceInfo) {
    return 'Unknown';
  }

  const returnString = `OS/Browser - ${deviceInfo.os ? deviceInfo.os : 'Unknown'}/${
    deviceInfo.browser ? deviceInfo.browser : 'Unknown'
  }`;

  return returnString;
};

export const revokeSession = async (sessionId) => {
  const payload = {
    method: 'DELETE',
    headers: authHeader(),
  };

  const response = await fetch(`/api/session/destroyActiveSession/${sessionId}`, payload);
  if (!response.ok) {
    handleError(response);
    return null;
  }

  return true;
};

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
