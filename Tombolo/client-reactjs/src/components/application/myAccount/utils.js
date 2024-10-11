import { authHeader, handleError } from '../../common/AuthHeader';
import React from 'react';
export const changeBasicUserPassword = async (values) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(values),
  };

  //get user from local storage
  const user = JSON.parse(localStorage.getItem('user'));

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
  const user = JSON.parse(localStorage.getItem('user'));

  const response = await fetch(`/api/user/update/${user?.id}`, payload);
  if (!response.ok) {
    handleError(response);
    return null;
  }

  const data = await response.json();

  if (data) {
    //update user in local storage
    localStorage.setItem('user', JSON.stringify(data));
  }

  return data;
};

export const applicationStringBuilder = (applications) => {
  let applicationString = '';
  applications.forEach((application, index) => {
    applicationString += application.application.title;
    if (index < applications.length - 1) {
      applicationString += ', ';
    }
  });

  return applicationString;
};

export const roleStringBuilder = (roles) => {
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

  const returnString = (
    <>
      <p>Operating System - {deviceInfo.os ? deviceInfo.os : 'Unknown'}</p>
      <p>Initial IP - {deviceInfo.ip ? deviceInfo.ip : 'Unknown'}</p>
    </>
  );

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
