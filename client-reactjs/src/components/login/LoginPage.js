import React, { useEffect, useState } from 'react';
import { userActions } from '../../redux/actions/User';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input } from 'antd';

import { Link, useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

const LoginPage = () => {
  const { user, loggedIn } = useSelector((state) => state.authenticationReducer);
  const [login, setLogin] = useState({ loading: false, success: false, error: '' });

  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const handleSubmit = async (values) => {
    try {
      setLogin(() => ({ loading: true, error: '', success: false }));

      const payload = {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      };

      const response = await fetch('/api/user/authenticate', payload);
      const data = await response.json();

      if (!response.ok) {
        let message = data?.message || data?.errors || response.statusText;
        if (Array.isArray(message)) message.join(', ');
        throw new Error(message);
      } else {
        if (!data.accessToken) throw new Error('Token not found');
        dispatch(userActions.login(data.accessToken));
        setLogin(() => ({ loading: false, success: true, error: '' }));
      }
    } catch (error) {
      console.log('login fetch error', error);
      setLogin(() => ({ loading: false, success: false, error: error.message }));
    }
  };

  useEffect(() => {
    if (user.id && loggedIn) {
      history.replace(location.state?.from?.pathname || '/');
    }
  }, [loggedIn]);

  return (
    <Form className="login-form" onFinish={handleSubmit}>
      <h2 className="login-logo">Tombolo</h2>
      <Form.Item name="username" rules={[{ required: true, message: 'Please provide your Username!' }]}>
        <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Username" />
      </Form.Item>

      <Form.Item name="password" rules={[{ required: true, message: 'Please provide your Password!' }]}>
        <Input.Password
          prefix={<LockOutlined className="site-form-item-icon" />}
          type="password"
          placeholder="Password"
        />
      </Form.Item>

      <Form.Item>
        <Link to={'/forgot-password'} className="login-form-forgot">
          Forgot password ?
        </Link>
      </Form.Item>

      <Form.Item>
        <Button loading={login.loading} htmlType="submit" type="primary" block className="login-form-button">
          Log in
        </Button>
      </Form.Item>

      <Form.Item>
        Or <Link to={'/register'}>register now</Link>
      </Form.Item>

      {login.success && (
        <Form.Item>
          <Alert message="Success" description="You will be redirected shortly" type="success" showIcon />
        </Form.Item>
      )}

      {login.error && (
        <Form.Item>
          <Alert message={(login.error || 'Error') + ', check your inputs and try again'} type="error" showIcon />
        </Form.Item>
      )}
    </Form>
  );
};

export default LoginPage;
