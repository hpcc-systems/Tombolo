import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Divider, Spin, message } from 'antd';
import msLogo from '../../images/mslogo.png';
import { getDeviceInfo } from './utils';
import { authActions } from '../../redux/actions/Auth';
import { Constants } from '../common/Constants';

const Login = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    const { email, password } = values;
    setLoading(true);

    //get browser and os info and put in deviceInfo variable
    const deviceInfo = getDeviceInfo();

    const test = await authActions.login({ email, password, deviceInfo });

    if (test?.type === Constants.LOGIN_SUCCESS) {
      //reload page if login is succesful
      window.location.href = '/';
      return;
    }

    //handle login failed
    if (test?.type === Constants.LOGIN_FAILED) {
      message.error('Username and Password combination not found.');
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

  //if session expired relay message to user what happened

  useEffect(() => {
    const sessionExpired = localStorage.getItem('sessionExpired');

    if (sessionExpired) {
      localStorage.removeItem('sessionExpired');
      message.error('Session expired. Please log in again.');
    }
  });

  const azureLogin = () => {
    authActions.azureLoginRedirect();
  };

  const azureLoginFunc = async (code) => {
    setLoading(true);
    const res = await authActions.loginOrRegisterAzureUser({ code });

    if (res?.type === Constants.LOGIN_SUCCESS) {
      //reload page if login is succesful
      window.location.href = '/';
      return;
    } else if (res?.type === Constants.LOGIN_FAILED || !res) {
      message.error('Azure Login Failed');
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    //get url and check for id token
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      azureLoginFunc(code);
    }
  });

  const authMethods = process.env.REACT_APP_AUTH_METHODS;
  let azureEnabled = false;

  if (authMethods) {
    azureEnabled = authMethods.split(',').includes('azure');
  }

  return (
    <>
      <Form onFinish={onFinish} layout="vertical">
        {loading && (
          <div
            style={{
              textAlign: 'center',
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              position: 'absolute',
              zIndex: '2000',
              height: '100%',
              opacity: '.4',
              backgroundColor: 'black',
              top: '0',
              left: '0',
            }}>
            <Spin size="large" style={{ margin: '0 auto' }} />
          </div>
        )}

        {azureEnabled ? (
          <>
            <Divider>Log In With</Divider>
            <Form.Item>
              <Button
                size="large"
                style={{ background: 'black', color: 'white' }}
                className="fullWidth"
                onClick={() => azureLogin()}>
                <img src={msLogo} style={{ height: '3rem', width: 'auto' }} />
              </Button>
            </Form.Item>
            <Divider>Or</Divider>
          </>
        ) : (
          <Divider>Log in</Divider>
        )}
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
        <p style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}>
          <span>Need an account?</span> <a href="/register">Register</a>
        </p>
      </Form>
    </>
  );
};

export default Login;
