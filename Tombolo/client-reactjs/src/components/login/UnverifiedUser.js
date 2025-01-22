//Libraries
import React, { useRef, useState, useEffect } from 'react';
import { Button, Typography, Card, message } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

// Local imports
const { resendVerificationCode } = require('./utils');

const { Text } = Typography;
const defaultDelay = 90; // 10 seconds

function UnverifiedUser({ setUnverifiedUserLoginAttempt, email = 'yadhap.dahal@lexisnexisrisk.com' }) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sentVerificationEmail, setSentVerificationEmail] = useState(false);
  const [canSendVerificationEmail, setCanSendVerificationEmail] = useState(true);
  const [emailSendDelay, setEmailSendDelay] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const t = useRef(null);

  // Set timer function
  const startTimer = () => {
    setEmailSendDelay(0);
    const interval = setInterval(() => {
      setEmailSendDelay((prev) => {
        const newSeconds = prev + 1;
        if (newSeconds === defaultDelay) {
          setCanSendVerificationEmail(true);
          clearTimer(interval); // Clear the timer when it reaches defaultDelay
        }
        return newSeconds;
      });
    }, 1000);
    setTimerInterval(interval); // Store the interval ID
  };

  // Clear timer function
  const clearTimer = (interval) => {
    clearInterval(interval);
    setEmailSendDelay(defaultDelay); // Reset the time
  };

  const resendVerificationLink = async () => {
    // Make a request to the server
    try {
      setSendingEmail(true);
      setCanSendVerificationEmail(false);
      setSendingEmail(false);
      await resendVerificationCode(email);
      setSentVerificationEmail(true);
      // Start the delay timer
      t.current = startTimer();
    } catch (error) {
      message.error(error.message);
      setCanSendVerificationEmail(true);
    }
  };

  useEffect(() => {
    return () => {
      clearTimer(timerInterval);
      console.log('Cleared timer');
    };
  }, []);

  return (
    <Card style={{ margin: '1rem auto', padding: '0.5rem', textAlign: 'center' }}>
      {!sentVerificationEmail ? (
        <>
          <Text type="danger" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            Your account is not yet verified.
          </Text>
          <Text style={{ display: 'block', margin: '1rem 0' }}>
            Please check your email for a verification link. If you did not receive an email, click the button below to
            resend the verification link.
          </Text>
          <div
            direction="vertical"
            size="middle"
            style={{ display: 'flex', gap: '0.2rem', justifyContent: 'space-around' }}>
            <Button type="primary" onClick={resendVerificationLink} style={{ width: '50%' }}>
              Resend Verification Link
            </Button>
            <Button type="primary" danger style={{ width: '50%' }} onClick={() => setUnverifiedUserLoginAttempt(false)}>
              Back to Login
            </Button>
          </div>
        </>
      ) : (
        <>
          {sendingEmail ? (
            <Text type="success" style={{ color: 'var(--dark)', fontSize: '1rem', fontWeight: 'bold' }}>
              Sending Verification E-mail ...
            </Text>
          ) : (
            <Text type="success" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              <CheckCircleFilled /> Verification E-mail sent
            </Text>
          )}

          <Text style={{ display: 'block', margin: '1rem 0' }}>
            {` Verification email has been sent to your email address. Please check your inbox and click the link in the
            email to complete the verification process. If you don't see the email, check your spam or junk folder.`}
          </Text>
          <div direction="vertical" size="middle" style={{ display: 'flex', gap: '1rem' }}>
            <Button
              type="primary"
              disabled={!canSendVerificationEmail}
              onClick={resendVerificationLink}
              style={{ width: '50%' }}>
              Resend Verification Link{' '}
              {emailSendDelay !== defaultDelay ? `(Wait ${defaultDelay - emailSendDelay} seconds)` : ''}
            </Button>
            <Button type="primary" danger onClick={() => setUnverifiedUserLoginAttempt(false)} style={{ width: '50%' }}>
              Back to Login
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

export default UnverifiedUser;
