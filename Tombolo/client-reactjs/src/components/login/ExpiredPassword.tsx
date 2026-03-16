import React, { useState } from 'react';
import { Button } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

import authService from '@/services/auth.service';
import styles from './login.module.css';

type Props = { email?: string | null };

function ExpiredPassword({ email }: Props) {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resetError, setResetError] = useState(false);

  const passwordExpiredMessage = (
    <div>
      <span className={styles.passwordExpired_header}>Password Expired !</span>
      <div>
        Your password has expired because it was not changed within the required reset period or you have not logged in
        for more than 90 days. To regain access to the application, please click the button below to request a password
        reset.
      </div>
    </div>
  );

  const SuccessMessage = (
    <div>
      <div className={styles.passwordExpired__successMessage}>
        <CheckCircleFilled /> {successMessage}
      </div>
      <div style={{ fontSize: '1rem' }}>
        Your password reset request has been submitted. An administrator will review your request and take the necessary
        action.
      </div>
      <div>
        <Button color="primary" type="primary" href="/login">
          Back to Login
        </Button>
      </div>
    </div>
  );

  const ErrorMessage = (
    <div>
      <div className={styles.passwordExpired__errorMessage}>
        <CloseCircleFilled /> Error Submitting Request
      </div>
      <div style={{ fontSize: '1rem' }}>
        There was an error submitting your password reset request. Please try again or contact your system
        administrator.
      </div>
    </div>
  );

  const renderMessage = {
    resetSuccess: SuccessMessage,
    resetError: ErrorMessage,
    passwordExpiredMessage,
  };

  const handleResetPassword = async () => {
    try {
      setResetting(true);
      const response = await authService.handlePasswordResetRequest(email);
      setSuccessMessage(response.message);
      setResetting(false);
      setResetSuccess(true);
    } catch {
      setResetError(true);
      setResetting(false);
    }
  };

  return (
    <div className={styles.passwordExpired_container}>
      {resetSuccess && renderMessage.resetSuccess}
      {resetError && renderMessage.resetError}
      {!resetSuccess && !resetError && renderMessage.passwordExpiredMessage}

      {resetSuccess || (
        <Button color="primary" onClick={handleResetPassword} type="primary">
          {resetting ? 'Requesting Password Reset' : 'Request Password Reset'}
        </Button>
      )}
    </div>
  );
}

export default ExpiredPassword;
