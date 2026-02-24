import React, { useRef, useState, useEffect } from 'react';
import { Button, Typography, Card } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

import { handleError } from '../common/handleResponse';
import authService from '@/services/auth.service';
import styles from './login.module.css';

const { Text } = Typography;
const defaultDelay = 90;

type Props = {
  setUnverifiedUserLoginAttempt: (v: boolean) => void;
  email?: string;
};

function UnverifiedUser({ setUnverifiedUserLoginAttempt, email = '' }: Props) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sentVerificationEmail, setSentVerificationEmail] = useState(false);
  const [canSendVerificationEmail, setCanSendVerificationEmail] = useState(true);
  const [emailSendDelay, setEmailSendDelay] = useState(0);
  const [timerInterval, setTimerInterval] = useState<any>(null);

  const t = useRef<any>(null);

  const startTimer = () => {
    setEmailSendDelay(0);
    const interval = setInterval(() => {
      setEmailSendDelay((prev) => {
        const newSeconds = prev + 1;
        if (newSeconds === defaultDelay) {
          setCanSendVerificationEmail(true);
          clearTimer(interval);
        }
        return newSeconds;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  const clearTimer = (interval: any) => {
    clearInterval(interval);
    setEmailSendDelay(defaultDelay);
  };

  const resendVerificationLink = async () => {
    try {
      setSendingEmail(true);
      setCanSendVerificationEmail(false);
      setSendingEmail(false);
      await authService.resendVerificationCode(email);
      setSentVerificationEmail(true);
      t.current = startTimer();
    } catch (error: any) {
      handleError(error.message);
      setCanSendVerificationEmail(true);
    }
  };

  useEffect(() => {
    return () => {
      clearTimer(timerInterval);
    };
  }, []);

  return (
    <Card className={styles.unverifiedContainer}>
      {!sentVerificationEmail ? (
        <>
          <Text type="danger" className={styles.notVerified}>
            Your account is not yet verified.
          </Text>
          <Text className={styles.checkEmail}>
            Please check your email for a verification link. If you did not receive an email, click the button below to
            resend the verification link.
          </Text>
          <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'space-around' }}>
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
            <Text type="success" className={styles.sendingEmail}>
              Sending Verification E-mail ...
            </Text>
          ) : (
            <Text type="success" className={styles.emailSent}>
              <CheckCircleFilled /> Verification E-mail sent
            </Text>
          )}

          <Text className={styles.checkEmail}>
            {` Verification email has been sent to your email address. Please check your inbox and click the link in the
            email to complete the verification process. If you don't see the email, check your spam or junk folder.`}
          </Text>
          <div className={styles.unverifiedFooterContainer}>
            <Button type="primary" disabled={!canSendVerificationEmail} onClick={resendVerificationLink} style={{ width: '50%' }}>
              Resend Verification Link {emailSendDelay !== defaultDelay ? `(Wait ${defaultDelay - emailSendDelay} seconds)` : ''}
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
