import React from 'react';
import { CloseCircleOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import bcrypt from 'bcryptjs-react';

function passwordComplexityValidator({ password, user, oldPasswordCheck }) {
  // Define your password complexity rules here
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const isNotUserInfo =
    !password.trim().toLowerCase().includes(user?.firstName.trim().toLowerCase()) &&
    !password.includes(user?.lastName.trim().toLowerCase()) &&
    !password.includes(user?.email.trim().toLowerCase());

  //need to only check for old passwords if oldPasswordCheck flag is passed,
  //this is to avoid performance issues when checking password complexity on the client side
  let isNotOldPassword = 'loading';
  if (oldPasswordCheck) {
    isNotOldPassword = user?.metaData?.previousPasswords?.every(oldPassword => {
      return !bcrypt.compareSync(password, oldPassword);
    });
  }

  // Define your error messages here
  const uppercaseMessage = 'Password must contain at least one uppercase letter';
  const lowercaseMessage = 'Password must contain at least one lowercase letter';
  const numberMessage = 'Password must contain at least one number';
  const specialMessage = 'Password must contain at least one special character';
  const lengthMessage = `Password must be at least ${minLength} characters long`;
  const userInfoMessage = 'Password cannot contain your name or email address';
  const oldPasswordMessage = 'Password cannot be the same as old passwords';

  let errors = [];
  errors.push({
    attributes: [
      { name: 'uppercase', message: uppercaseMessage },
      { name: 'lowercase', message: lowercaseMessage },
      { name: 'number', message: numberMessage },
      { name: 'special', message: specialMessage },
      { name: 'length', message: lengthMessage },
      { name: 'userInfo', message: userInfoMessage },
    ],
  });

  if (oldPasswordCheck) {
    errors[0].attributes.push({ name: 'oldPassword', message: oldPasswordMessage });
  }

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
  if (!password || (password && password.length < minLength)) {
    errors.push({ type: 'length' });
  }
  if (!isNotUserInfo) {
    errors.push({ type: 'userInfo' });
  }
  if (oldPasswordCheck) {
    errors.push({ type: 'oldPassword' });
  }

  const passwordComplexityContent = errors[0].attributes.map(error => {
    const errorExistsForAttribute = errors.some(error2 => error2?.type === error.name);

    return (
      <li key={error.name} style={{ marginBottom: '.5rem' }}>
        {errorExistsForAttribute ? (
          <>
            {error.name === 'oldPassword' && isNotOldPassword === 'loading' ? (
              <LoadingOutlined style={{ color: 'orange', marginRight: '.5rem' }} />
            ) : (
              <CloseCircleOutlined style={{ color: 'red', marginRight: '.5rem' }} />
            )}
          </>
        ) : (
          <>
            {error.name === 'oldPassword' && isNotOldPassword === 'loading' ? (
              <LoadingOutlined style={{ color: 'orange', marginRight: '.5rem' }} />
            ) : (
              <CheckCircleOutlined style={{ color: 'green', marginRight: '.5rem' }} />
            )}
          </>
        )}
        <span>{error.message}</span>
      </li>
    );
  });

  return (
    <>
      <ul style={{ listStyle: 'none', marginLeft: 0, paddingInlineStart: 0 }}>{passwordComplexityContent}</ul>
    </>
  );
}

export default passwordComplexityValidator;
