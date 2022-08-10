import React, { useEffect } from 'react';
import { userActions } from '../../redux/actions/User';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input } from 'antd';

import { Link, useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

const LoginPage = () => {
  const { user, loggedIn, login } = useSelector((state) => state.authenticationReducer);
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const handleSubmit = async (values) => {
    dispatch(userActions.login(values));
  };

  const resetLogin = () => dispatch(userActions.resetLogin());

  useEffect(() => {
    if (user.id && loggedIn) {
      history.replace(location.state?.from?.pathname || '/');
    }
  }, [login.success]);

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
        <Link onClick={resetLogin} to={'/forgot-password'} className="login-form-forgot">
          Forgot password ?
        </Link>
      </Form.Item>

      <Form.Item>
        <Button loading={login.loading} htmlType="submit" type="primary" block className="login-form-button">
          Log in
        </Button>
      </Form.Item>

      <Form.Item>
        Or{' '}
        <Link onClick={resetLogin} to={'/register'}>
          register now
        </Link>
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
