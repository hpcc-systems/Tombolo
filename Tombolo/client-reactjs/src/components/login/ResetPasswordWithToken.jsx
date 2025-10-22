import React, { useEffect, useState, useRef } from 'react';
import { Form, Input, Button, Divider, message, Popover } from 'antd';
import { Link, useParams } from 'react-router-dom';
import passwordComplexityValidator from '../common/passwordComplexityValidator';
import { authHeader } from '../common/AuthHeader';

import { getDeviceInfo } from './utils';
import { setUser } from '../common/userStorage';

const ResetPassword = () => {
  const [popOverContent, setPopOverContent] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  //we will get the reset token from the url and test if it is valid to get the user information
  const { resetToken } = useParams();
  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();

  //ref to track if user is finished typing
  const finishedTypingRef = useRef(false);
  const isFirstLoad = useRef(true);

  //need to detect when user is finished typing to run check previous password validator, otherwise perofrmance is too slow
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isFirstLoad.current) {
        validatePassword(form.getFieldValue('newPassword'), true);
        finishedTypingRef.current = true;
        form.validateFields(['newPassword']);
      } else {
        isFirstLoad.current = false;
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [form.getFieldValue('newPassword')]);

  const validatePassword = (value, checkOldPassword) => {
    let pw = value;
    if (!value) {
      pw = '';
    }

    if (userDetails) {
      if (checkOldPassword) {
        setPopOverContent(
          passwordComplexityValidator({
            password: pw,
            generateContent: true,
            user: userDetails,
            oldPasswordCheck: true,
          })
        );
      } else {
        setPopOverContent(passwordComplexityValidator({ password: pw, generateContent: true, user: userDetails }));
      }
    }
  };

  const onLoad = async () => {
    //get user details from /api/auth//getUserDetailsWithToken/:token
    try {
      const url = '/api/auth/getUserDetailsWithToken/' + resetToken;

      const response = await fetch(url, {
        headers: authHeader(),
        method: 'GET',
      });

      if (!response.ok) {
        let json = await response.json();
        if (json.message) {
          message.error(json.message);
        } else {
          message.error('An undefined error occurred. Please try again later');
        }
        return;
      }

      if (response.ok) {
        let json = await response.json();
        setUserDetails(json?.user);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  useEffect(() => {
    if (userDetails === null && resetToken !== undefined) {
      onLoad();
    }
  }, [resetToken, userDetails]);

  const invalidToken = () => {
    messageApi.open({
      type: 'error',
      content: (
        <>
          <span>
            The reset token provided is either expired or invalid, please go to the{' '}
            <Link to="/forgot-password">Forgot Password</Link> page to get a new one.
          </span>
        </>
      ),
      duration: 100,
      style: {
        marginTop: '20vh',
      },
    });
  };

  //if there is no token, we will show an error message to the user
  useEffect(() => {
    if (resetToken === undefined) {
      invalidToken();
    }
  }, []);

  const onFinish = async (values) => {
    try {
      const url = '/api/auth/resetPasswordWithToken';
      const password = values.newPassword;
      const deviceInfo = getDeviceInfo();

      const response = await fetch(url, {
        headers: authHeader(),
        method: 'POST',
        body: JSON.stringify({ password, token: resetToken, deviceInfo }),
      });

      if (!response.ok) {
        let json = await response.json();

        if (json.message) {
          message.error(json.message);
        } else {
          message.error('An undefined error occurred. Please try again later');
        }
        return;
      }

      if (response.ok) {
        message.success('Password reset successfully.');
        let json = await response.json();
        if (json.success === true) {
          json.data.isAuthenticated = true;
          setUser(json.data);
          //reload window
          window.location.href = '/';
        }
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  useEffect(() => {}, [popOverContent]);

  return (
    <Form onFinish={onFinish} layout="vertical" form={form}>
      {contextHolder}
      <Divider>Reset Password</Divider>
      <Popover content={popOverContent} title="Password Complexity" trigger="focus" placement="right">
        <Form.Item
          label={
            <>
              <span>New Password&nbsp;</span>
            </>
          }
          name="newPassword"
          rules={[
            { required: true, message: 'Please input your new password!' },
            { max: 64, message: 'Maximum of 64 characters allowed' },
            () => ({
              validator(_, value) {
                if (!value) {
                  return Promise.reject();
                }
                //make sure it doesn't equal current password
                if (form.getFieldValue('currentPassword') === value) {
                  return Promise.reject(new Error('New password cannot be the same as the current password!'));
                }
                let errors = [];

                if (finishedTypingRef.current) {
                  errors = passwordComplexityValidator({ password: value, user: userDetails, oldPasswordCheck: true });
                } else {
                  errors = passwordComplexityValidator({ password: value, user: userDetails });
                }

                finishedTypingRef.current = false;

                //passwordComplexityValidator always returns an array with at least one attributes element
                if (!value || errors.length === 1) {
                  return Promise.resolve();
                } else {
                  return Promise.reject(new Error('Password does not meet complexity requirements!'));
                }
              },
            }),
          ]}>
          <Input.Password
            size="large"
            autoComplete="new-password"
            onChange={(e) => {
              validatePassword(e.target.value);
            }}
            onFocus={(e) => {
              validatePassword(e.target.value, true);
            }}
            onBlur={(e) => {
              validatePassword(e.target.value, true);
            }}
          />
        </Form.Item>
      </Popover>
      <Form.Item
        label={
          <>
            <span>Confirm Password&nbsp;</span>
          </>
        }
        name="confirmPassword"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: 'Please confirm your new password!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords do not match!'));
            },
          }),
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input.Password size="large" autoComplete="new-password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="fullWidth">
          Reset Password
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ResetPassword;
