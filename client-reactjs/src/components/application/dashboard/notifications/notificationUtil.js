import { authHeader } from '../../../common/AuthHeader.js';

// Function to get all sent notifications
export const getAllSentNotifications = async ({ applicationId }) => {
  const payload = {
    method: 'GET',
    header: authHeader(),
  };

  const response = await fetch(`/api/sent_notifications/${applicationId}`, payload);

  if (!response.ok) {
    throw new Error('Failed to fetch sent notifications');
  }

  const data = await response.json();
  return data;
};

// Function to delete a single notification
export const deleteNotification = async (id) => {
  const payload = {
    method: 'DELETE',
    header: authHeader(),
  };

  const response = await fetch(`/api/sent_notifications/${id}`, payload);

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }

  return true;
};

// Function to delete multiple notifications - send ids as array in req.body
export const deleteMultipleNotifications = async (ids) => {
  const payload = {
    method: 'DELETE',
    header: authHeader(),
    body: JSON.stringify({ ids }),
  };

  const response = await fetch(`/api/sent_notifications`, payload);

  if (!response.ok) {
    throw new Error('Failed to delete notifications');
  }

  return true;
};

// Function to create a new notification
export const createNotification = async ({ notificationPayload }) => {
  const payload = {
    method: 'POST',
    header: authHeader(),
    body: JSON.stringify(notificationPayload),
  };

  const response = await fetch(`/api/sent_notifications`, payload);

  if (!response.ok) {
    throw new Error('Failed to create notification');
  }
  const data = await response.json();
  return data;
};

//Function to update multiple notifications - send ids as array in req.body
export const updateMultipleNotifications = async ({ data }) => {
  const payload = {
    method: 'PATCH',
    header: authHeader(),
    body: JSON.stringify(data),
  };

  const response = await fetch(`/api/sent_notifications`, payload);

  if (!response.ok) {
    throw new Error('Failed to update notifications');
  }
  const responseData = await response.json();
  return responseData;
};

// Statuses for the notification
export const statuses = [
  'Investigating',
  'Re-opened',
  'Triage',
  'Pending Review',
  'On hold',
  'Resolved',
  'Non-actionable',
  'Non-issue',
];
