// utils/handleError.js
import { notification } from 'antd';

export const handleError = (error) => {
  let messages = [];

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

  notification.error({
    message: 'Error occurred',
    className: 'error-notification',
    showProgress: true,
    duration: 8,
    style: {
      borderBottomColor: 'red !important',
    },
    description: (
      <>
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </>
    ),
  });
};
