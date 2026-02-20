import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Divider, Spin } from 'antd';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { handleError } from '../common/handleResponse';
import { getDeviceInfo } from './utils';
import { Constants } from '../common/Constants';
import UnverifiedUser from './UnverifiedUser';
import ExpiredPassword from './ExpiredPassword';
import AzureLoginButton from './AzureLoginButton';

import { login, azureLoginRedirect, loginOrRegisterAzureUser } from '@/redux/slices/AuthSlice';
import styles from './login.module.css';

const authMethodsRaw = import.meta.env.VITE_AUTH_METHODS as any;
const methods = Array.isArray(authMethodsRaw)
  ? authMethodsRaw
  : typeof authMethodsRaw === 'string'
    ? authMethodsRaw
        .split(',')
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

const hasAllAzureEnv = [
  import.meta.env.VITE_AZURE_CLIENT_ID,
  import.meta.env.VITE_AZURE_TENENT_ID,
  import.meta.env.VITE_AZURE_REDIRECT_URI,
].every((v: any) => typeof v === 'string' && v.trim().length > 0);

if (methods.includes('azure') && !hasAllAzureEnv) {
  // eslint-disable-next-line no-console
  console.warn('[Login] Azure auth is enabled but missing/invalid environment variables');
}

const Login: React.FC = () => {
  const dispatch: any = useDispatch();
  const location = useLocation<any>();
  const history = useHistory();

  const isValidInternalUrl = (url: any) => {
    try {
      if (typeof url !== 'string' || !url) return false;
      if (!url.startsWith('/')) return false;
      if (url.startsWith('//')) return false;
      return true;
    } catch {
      return false;
    }
  };

  const getRedirectUrl = () => {
    const intendedUrl = localStorage.getItem('intendedUrl');
    if (intendedUrl) {
      const isAuthRoute =
        intendedUrl === '/login' ||
        intendedUrl.startsWith('/login?') ||
        intendedUrl.startsWith('/login/') ||
        intendedUrl === '/register' ||
        intendedUrl.startsWith('/register?') ||
        intendedUrl.startsWith('/register/') ||
        intendedUrl === '/forgot-password' ||
        intendedUrl.startsWith('/forgot-password?') ||
        intendedUrl.startsWith('/forgot-password/');
      if (!isAuthRoute && isValidInternalUrl(intendedUrl)) {
        localStorage.removeItem('intendedUrl');
        return intendedUrl;
      }
      localStorage.removeItem('intendedUrl');
    }

    if (location.state?.from) {
      const { pathname, search = '', hash = '' } = location.state.from;
      const fullPath = `${pathname}${search}${hash}`;
      if (fullPath !== '/' && isValidInternalUrl(fullPath)) {
        return fullPath;
      }
    }

    return '/';
  };

  const safeRedirect = (url: any) => {
    try {
      if (isValidInternalUrl(url)) {
        const baseUrl = window.location.origin;
        const fullUrl = new URL(url, baseUrl);
        if (fullUrl.origin === baseUrl) {
          window.location.href = fullUrl.pathname + fullUrl.search + fullUrl.hash;
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/';
  };

  const [unverifiedUserLoginAttempt, setUnverifiedUserLoginAttempt] = useState(false);
  const [expiredPassword, setExpiredPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [azureLoginAttempted, setAzureLoginAttempted] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const [loginForm] = Form.useForm();

  const onFinish = async (values: any) => {
    const { email, password } = values;
    setEmail(email);
    setLoading(true);

    const deviceInfo = getDeviceInfo();

    const test: any = await dispatch(login({ email, password, deviceInfo }));

    if (test.payload?.type === Constants.LOGIN_TEMP_PW) {
      handleError(
        'You are trying to log in with a temporary password. Please follow the secure link sent to your email to set a new password.'
      );
      setLoading(false);
      return;
    }

    if (test.payload?.type === Constants.LOGIN_UNVERIFIED) {
      setUnverifiedUserLoginAttempt(true);
      setLoading(false);
      return;
    }

    if (test.payload?.type === Constants.LOGIN_PW_EXPIRED) {
      setExpiredPassword(true);
      return;
    }

    if (test.payload?.type === Constants.LOGIN_SUCCESS) {
      safeRedirect(getRedirectUrl());
      return;
    }

    if (test.payload?.type === Constants.LOGIN_FAILED) {
      loginForm.setFieldsValue({ password: null });
      setLoading(false);
      return;
    }

    if (!test) {
      handleError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
    return;
  };

  useEffect(() => {
    const sessionExpired = localStorage.getItem('sessionExpired');

    if (sessionExpired) {
      localStorage.removeItem('sessionExpired');
      handleError('Session expired. Please log in again.');
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code && !loading && !azureLoginAttempted) {
      azureLoginFunc(code);
    }
  }, [azureLoginAttempted, loading]);

  const azureLogin = () => {
    azureLoginRedirect();
  };

  const azureLoginFunc = async (code: any) => {
    try {
      setLoading(true);
      const res: any = await dispatch(loginOrRegisterAzureUser(code));

      if (res?.payload?.type === Constants.LOGIN_SUCCESS) {
        const redirectUrl = getRedirectUrl();
        history.replace(redirectUrl);
        return;
      }
    } catch (err: any) {
      handleError(err.message);
      setLoading(false);
      return;
    } finally {
      setAzureLoginAttempted(true);
      setLoading(false);
    }
  };

  const azureEnabled = methods.includes('azure') && hasAllAzureEnv;
  const traditionalEnabled = methods.includes('traditional');

  return (
    <>
      {unverifiedUserLoginAttempt && (
        <UnverifiedUser setUnverifiedUserLoginAttempt={setUnverifiedUserLoginAttempt} email={email} />
      )}
      {expiredPassword && <ExpiredPassword email={email} />}
      {!unverifiedUserLoginAttempt && !expiredPassword && (
        <>
          <Form onFinish={onFinish} layout="vertical" form={loginForm}>
            {loading && (
              <div className={styles.spinner_container}>
                <Spin size="large" style={{ margin: '0 auto' }} />
              </div>
            )}
            {azureEnabled && (
              <Form.Item>
                <AzureLoginButton onClick={() => azureLogin()} label="Login with Microsoft" />
              </Form.Item>
            )}

            {traditionalEnabled && azureEnabled && <Divider>Or</Divider>}

            {traditionalEnabled && (
              <>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      type: 'email',
                      message: 'Invalid e-mail address.',
                    },
                    { max: 64, message: 'Maximum of 64 characters allowed' },
                  ]}>
                  <Input size="large" />
                </Form.Item>
                <Form.Item
                  label={<>
                      <span>Password&nbsp;</span>
                    </>}
                  name="password"
                  rules={[
                    { required: true, message: 'Please input your password!' },
                    { max: 64, message: 'Maximum of 64 characters allowed' },
                  ]}>
                  <Input.Password name="password" size="large" autoComplete="new-password" />
                </Form.Item>
                <Link to="/forgot-password">Forgot password?</Link>
                <Form.Item>
                  <Button type="primary" htmlType="submit" disabled={loading && true} className="fullWidth">
                    Log in
                  </Button>
                </Form.Item>
                <p className={styles.helperLink}>
                  <span>Need an account?</span> <a href="/register">Register</a>
                </p>
              </>
            )}
          </Form>
        </>
      )}
    </>
  );
};

export default Login;
