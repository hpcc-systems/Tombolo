import React from 'react';
import { notification } from 'antd';

const VALIDATION_POINTER_PREFIX = /^[a-z_]+\[[^\]]+\]:\s*/i;

const stripValidationPointer = (message: string): string => {
  const trimmed = message.trim();
  return trimmed.replace(VALIDATION_POINTER_PREFIX, '').trim();
};

export const handleError = (error: any) => {
  let messages: string[] = [];

  if (Array.isArray(error)) {
    messages = error;
  } else if (typeof error === 'string') {
    messages = [error];
  } else if (error?.messages && Array.isArray(error.messages)) {
    messages = error.messages;
  } else if (error?.message) {
    messages = [error.message];
  } else {
    messages = ['An unknown error occurred'];
  }

  const normalizedMessages = messages
    .map(msg => stripValidationPointer(String(msg)))
    .filter(msg => msg.length > 0);

  const displayMessages =
    normalizedMessages.length > 0 ? normalizedMessages : ['An unknown error occurred'];

  notification.error({
    message: 'Error occurred',
    className: 'error-notification',
    showProgress: true,
    duration: 8,
    description: (
      <>
        {displayMessages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </>
    ),
  });
};

export const handleSuccess = (message?: string) => {
  notification.success({
    message,
    className: 'success-notification',
    showProgress: true,
    duration: 5,
  });
};
