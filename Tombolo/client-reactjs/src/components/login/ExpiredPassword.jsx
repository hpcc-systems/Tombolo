// Imports from Library
import React, { useState } from 'react';
import { Button } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

// Local Imports
import { requestPasswordReset } from './utils';

function ExpiredPassword({ email }) {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resetError, setResetError] = useState(false);

  const passwordExpiredMessage = (
    <div>
      <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)' }}>Password Expired !</span>
      <div>
        Your password has expired because it was not changed within the required reset period or you have not logged in
        for more than 90 days. To regain access to the application, please click the button below to request a password
        reset.
      </div>
    </div>
  );

  // Success message
  const SuccessMessage = (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          color: 'var(--success)',
          fontSize: '1.5rem',
          fontWeight: '700',
        }}>
        <CheckCircleFilled /> {successMessage}
      </div>
      <div style={{ fontSize: '1rem' }}>
        Your password reset request has been submitted. An administrator will review your request and take the necessary
        action.
      </div>
      <div>
        {/* Go back to login Button */}
        <Button color="primary" type="primary" href="/login">
          Back to Login
        </Button>
      </div>
    </div>
  );

  // Failure message
  const ErrorMessage = (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          color: 'var(--danger)',
          fontSize: '1.5rem',
          fontWeight: '700',
        }}>
        <CloseCircleFilled /> Error Submitting Request
      </div>
      <div style={{ fontSize: '1rem' }}>
        There was an error submitting your password reset request. Please try again or contact your system
        administrator.
      </div>
    </div>
  );

  // Render message based on reset status
  const renderMessage = {
    resetSuccess: SuccessMessage,
    resetError: ErrorMessage,
    passwordExpiredMessage,
  };

  // Handle reset password button click
  const handleResetPassword = async () => {
    try {
      setResetting(true);
      const response = await requestPasswordReset({ email });
      setSuccessMessage(response.message);
      setResetting(false);
      setResetSuccess(true);
    } catch (err) {
      setResetError(true);
      setResetting(false);
    }
  };

  //JSX
  return (
    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center', gap: '1rem' }}>
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
