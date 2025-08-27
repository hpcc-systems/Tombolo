import { useEffect, useState } from 'react';
import { Form, Input, Button, Divider, Spin, message } from 'antd';
import msLogo from '../../images/mslogo.png';
import { getDeviceInfo } from './utils';
import { Constants } from '../common/Constants';
import UnverifiedUser from './UnverifiedUser';
import ExpiredPassword from './ExpiredPassword';
import { useDispatch } from 'react-redux';
import { login, azureLoginRedirect, loginOrRegisterAzureUser } from '@/redux/slices/AuthSlice';

import styles from './login.module.css';

const Login = () => {
  const dispatch = useDispatch();

  const [unverifiedUserLoginAttempt, setUnverifiedUserLoginAttempt] = useState(false);
  const [expiredPassword, setExpiredPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [azureLoginAttempted, setAzureLoginAttempted] = useState(false);
  const [email, setEmail] = useState(null);

  const [loginForm] = Form.useForm();

  // When the form is submitted, this function is called
  const onFinish = async (values) => {
    const { email, password } = values;
    setEmail(email);
    setLoading(true);

    //get browser and os info and put in deviceInfo variable
    const deviceInfo = getDeviceInfo();

    const test = await dispatch(login({ email, password, deviceInfo }));

    if (test?.type === 'temp-pw') {
      setLoading(false);

      const resetLink = test.payload?.user?.resetLink;
      if (resetLink) {
        window.location.href = resetLink;
      } else {
        message.error('Please check your email for link to reset you temporary password.');
      }
      return;
    }

    if (test.payload?.type === Constants.LOGIN_UNVERIFIED) {
      setUnverifiedUserLoginAttempt(true);
      setLoading(false);
      return;
    }

    if (test.payload?.type === Constants.LOGIN_PW_EXPIRED) {
      // window.location.href = '/expired-password';
      setExpiredPassword(true);
      return;
    }

    if (test.payload?.type === Constants.LOGIN_SUCCESS) {
      // reload the page if login is successful
      window.location.href = '/';
      return;
    }

    //handle login failed
    if (test.payload?.type === Constants.LOGIN_FAILED) {
      loginForm.setFieldsValue({ password: null });
      setLoading(false);
      return;
    }

    //handle all other errors
    if (!test) {
      message.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
    return;
  };

  //if session expired relay message to user what happened
  useEffect(() => {
    const sessionExpired = localStorage.getItem('sessionExpired');

    if (sessionExpired) {
      localStorage.removeItem('sessionExpired');
      message.error('Session expired. Please log in again.');
    }
  });

  // If the URL contains a code parameter, it means the user has been redirected from Azure AD
  useEffect(() => {
    //get url and check for id token
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code && !loading && !azureLoginAttempted) {
      azureLoginFunc(code);
    }
  }, [azureLoginAttempted, loading]);

  const azureLogin = () => {
    azureLoginRedirect();
  };

  const azureLoginFunc = async (code) => {
    try {
      setLoading(true);
      const res = await dispatch(loginOrRegisterAzureUser(code));

      if (res?.payload?.type === Constants.LOGIN_SUCCESS) {
        //reload page if login is succesful
        window.location.href = '/';
        return;
      }
    } catch (err) {
      message.error(err.message);
      setLoading(false);
      return;
    } finally {
      setAzureLoginAttempted(true);
      setLoading(false);
    }
  };

  const authMethods = import.meta.env.VITE_AUTH_METHODS;
  let azureEnabled = false;
  let traditionalEnabled = false;

  if (authMethods) {
    azureEnabled = authMethods.split(',').includes('azure');
    traditionalEnabled = authMethods.split(',').includes('traditional');
  }

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
            <Divider>Log In With</Divider>
            {azureEnabled && (
              <Form.Item>
                <Button
                  size="large"
                  style={{ background: 'black', color: 'white' }}
                  className="fullWidth"
                  onClick={() => azureLogin()}>
                  <img src={msLogo} style={{ height: '3rem', width: 'auto' }} />
                </Button>
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
                  label={
                    <>
                      <span>Password&nbsp;</span>
                    </>
                  }
                  name="password"
                  rules={[
                    { required: true, message: 'Please input your password!' },
                    { max: 64, message: 'Maximum of 64 characters allowed' },
                  ]}>
                  <Input.Password size="large" autoComplete="new-password" />
                </Form.Item>
                <a href="/forgot-password">Forgot password?</a>
                <Form.Item>
                  <Button type="primary" htmlType="submit" disabled={loading && true} className="fullWidth">
                    Log in
                  </Button>
                </Form.Item>
                <p className={styles.helperLink}>
                  <span>Need an account?</span> <a href="/src/components/login/register">Register</a>
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
