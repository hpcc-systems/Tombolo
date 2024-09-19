import React from 'react';
import { CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

function passwordComplexityValidator({ password, generateContent }) {
  // Define your password complexity rules here
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  // Define your error messages here
  const uppercaseMessage = 'Password must contain at least one uppercase letter';
  const lowercaseMessage = 'Password must contain at least one lowercase letter';
  const numberMessage = 'Password must contain at least one number';
  const specialMessage = 'Password must contain at least one special character';
  const lengthMessage = `Password must be at least ${minLength} characters long`;

  let errors = [];
  errors.push({
    attributes: [
      { name: 'uppercase', message: uppercaseMessage },
      { name: 'lowercase', message: lowercaseMessage },
      { name: 'number', message: numberMessage },
      { name: 'special', message: specialMessage },
      { name: 'length', message: lengthMessage },
    ],
  });

  //checks if password meets the requirements
  if (!hasUppercase) {
    errors.push({ type: 'uppercase' });
  }
  if (!hasLowercase) {
    errors.push({ type: 'lowercase' });
  }
  if (!hasNumber) {
    errors.push({ type: 'number' });
  }
  if (!hasSpecialChar) {
    errors.push({ type: 'special' });
  }
  if (password.length < minLength) {
    errors.push({ type: 'length' });
  }

  if (generateContent) {
    const passwordComplexityContent = errors[0].attributes.map((error) => {
      const errorExistsForAttribute = errors.some((error2) => error2?.type === error.name);
      return (
        <li key={error.name} style={{ marginBottom: '.5rem' }}>
          {errorExistsForAttribute ? (
            <CloseCircleOutlined style={{ color: 'red', marginRight: '.5rem' }} />
          ) : (
            <CheckCircleOutlined style={{ color: 'green', marginRight: '.5rem' }} />
          )}
          <span>{error.message}</span>
        </li>
      );
    });

    const finalContent = (
      <ul style={{ listStyle: 'none', marginLeft: 0, paddingInlineStart: 0 }}>{passwordComplexityContent}</ul>
    );

    return finalContent;
  }

  return errors;
}

export default passwordComplexityValidator;
