// Imports from libraries
import React, { useState, useEffect } from 'react';
import { Form, Divider, Spin } from 'antd';
import { CheckCircleFilled, LoadingOutlined, CloseCircleFilled } from '@ant-design/icons';
import { useLocation, useHistory, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';

// Local imports
import RegisterUserForm from './registerUserForm';
import AzureLoginButton from './AzureLoginButton';
import { getDeviceInfo } from './utils';
import { setUser } from '../common/userStorage';
import { handleError, handleSuccess } from '../common/handleResponse';
import { registerBasicUser, azureLoginRedirect, loginOrRegisterAzureUser } from '@/redux/slices/AuthSlice';
import authService from '@/services/auth.service';
import styles from './login.module.css';

// Static auth config and Azure env validation (computed once per module load)
const authMethodsRaw = import.meta.env.VITE_AUTH_METHODS;
const methods = Array.isArray(authMethodsRaw)
  ? authMethodsRaw
  : typeof authMethodsRaw === 'string'
    ? authMethodsRaw
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

const hasAllAzureEnv = [
  import.meta.env.VITE_AZURE_CLIENT_ID,
  import.meta.env.VITE_AZURE_TENENT_ID,
  import.meta.env.VITE_AZURE_REDIRECT_URI,
].every(v => typeof v === 'string' && v.trim().length > 0);

// Warn once if Azure requested but misconfigured
if (methods.includes('azure') && !hasAllAzureEnv) {
  // eslint-disable-next-line no-console
  console.warn('[Register] Azure auth is enabled but missing/invalid environment variables');
}

const Register = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const [form] = Form.useForm();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [regId, setRegId] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(null);
  const [azureLoginAttempted, setAzureLoginAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // When component loads look for regId in the url
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('regId');

    if (id) {
      setRegId(id);
    }
  }, [location]);

  // Check for Azure auth code in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code && !loading && !azureLoginAttempted) {
      azureRegisterFunc(code);
    }
  }, [azureLoginAttempted, loading]);

  // When regId is set, verify the email
  useEffect(() => {
    if (regId) {
      setVerifying(true);
      const verifyUserAc = async () => {
        try {
          const response = await authService.verifyEmail(regId);

          if (!response) {
            throw new Error('Verification failed');
          }

          handleSuccess('Your email has been verified!');
          setRegistrationComplete(true);
          setVerifying(false);
          setUser(JSON.stringify(response));
          history.push('/');
        } catch (err) {
          setVerifying(false);
          setVerificationFailed(err?.messages?.[0] || err.message || 'Verification failed');
        }
      };

      verifyUserAc(regId);
    }
  }, [regId]);

  // Azure registration function
  const azureRegister = () => {
    azureLoginRedirect();
  };

  const azureRegisterFunc = async code => {
    try {
      setLoading(true);
      const res = await dispatch(loginOrRegisterAzureUser(code));

      if (res?.payload?.type === 'LOGIN_SUCCESS') {
        // Redirect to home or intended page after successful registration/login
        history.push('/');
        return;
      }
    } catch (err) {
      handleError(err.message);
      setLoading(false);
      return;
    } finally {
      setAzureLoginAttempted(true);
      setLoading(false);
    }
  };

  // When form is submitted
  const onFinish = async values => {
    try {
      values.deviceInfo = getDeviceInfo();
      const res = await dispatch(registerBasicUser(values));

      if (!registerBasicUser.fulfilled.match(res)) {
        return;
      }

      setRegistrationComplete(true);
    } catch (e) {
      handleError(e);
      setVerificationFailed(e.message[0]);
    }
  };

  // Determine which auth methods are enabled
  const azureEnabled = methods.includes('azure') && hasAllAzureEnv;
  const traditionalEnabled = methods.includes('traditional');

  return (
    <>
      {regId ? (
        <div className={styles.verifying_container}>
          {verifying && (
            <>
              <LoadingOutlined style={{ marginRight: '1rem' }} />
              <div>Verifying your E-mail</div>
            </>
          )}
          {verificationFailed && (
            <div>
              <p className={styles.helperLink} style={{ fontSize: '1.1rem' }}>
                <CloseCircleFilled style={{ marginRight: '1rem', color: 'red' }} twoToneColor="#eb2f96" fill="red" />
                {verificationFailed}
              </p>
            </div>
          )}
        </div>
      ) : registrationComplete ? (
        <div>
          <p className={styles.helperLink} style={{ fontSize: '1.1rem' }}>
            <CheckCircleFilled style={{ marginRight: '1rem', color: 'green' }} fill="green" />
            Registration complete. Please check your email to verify your account.
          </p>
          <div className={styles.helperLink}>
            <Link to="/login">Go to Login</Link>
          </div>
        </div>
      ) : (
        <>
          {loading && (
            <div className={styles.spinner_container}>
              <Spin size="large" style={{ margin: '0 auto' }} />
            </div>
          )}
          {(azureEnabled || traditionalEnabled) && (
            <>
              {azureEnabled && (
                <div style={{ marginBottom: '16px' }}>
                  <AzureLoginButton
                    onClick={() => azureRegister()}
                    disabled={loading}
                    label="Register with Microsoft"
                  />
                </div>
              )}
              {traditionalEnabled && azureEnabled && <Divider>Or</Divider>}
            </>
          )}
          {traditionalEnabled && (
            <>
              <RegisterUserForm form={form} onFinish={onFinish} />
              <p className={styles.helperLink}>
                <span>Already have an account?</span> <Link to="/login">Login</Link>
              </p>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Register;
