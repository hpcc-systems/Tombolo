import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Spin, message, Popover } from 'antd';
import { resetTempPassword } from './utils';
import passwordComplexityValidator from '../common/passwordComplexityValidator';
import { setUser } from '../common/userStorage';
import { authHeader } from '../common/AuthHeader';

function ResetTempPassword() {
  const [loading, setLoading] = useState(false);
  const [popOverContent, setPopOverContent] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [form] = Form.useForm();

  //ref to track if user is finished typing
  const finishedTypingRef = useRef(false);

  //need to detect when user is finished typing to run check previous password validator, otherwise perofrmance is too slow
  useEffect(() => {
    const timer = setTimeout(() => {
      validatePassword(form.getFieldValue('password'), true);
      finishedTypingRef.current = true;
      form.validateFields(['password']);
    }, 1000);

    return () => clearTimeout(timer);
  }, [form.getFieldValue('password')]);

  const validatePassword = (value, checkOldPassword) => {
    let pw = value;
    if (!value) {
      pw = '';
    }

    if (checkOldPassword) {
      setPopOverContent(
        passwordComplexityValidator({ password: pw, generateContent: true, userDetails, oldPasswordCheck: true })
      );
    } else {
      setPopOverContent(passwordComplexityValidator({ password: pw, generateContent: true, userDetails }));
    }
  };
  // On component load, get the token from the URL
  useEffect(() => {
    const url = window.location.href;
    const urlParts = url.split('/');
    const token = urlParts[urlParts.length - 1];
    setResetToken(token);
  }, []);

  const onLoad = async () => {
    //get user details from /api/auth//getUserDetailsWithToken/:token
    try {
      const url = '/api/auth/getUserDetailsWithVerificationCode/' + resetToken;

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
    if (userDetails === null && resetToken !== null) {
      onLoad();
    }
  }, [resetToken, userDetails]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      let values;
      try {
        values = await form.validateFields();
      } catch (err) {
        return;
      }
      values.token = resetToken;
      const result = await resetTempPassword(values);

      if (result?.data) {
        let user = result.data;

        //set isAuthenticated to true so application loads
        user.isAuthenticated = true;

        // Save user token to local storage
        setUser(JSON.stringify(user));
        window.location.href = '/';
      } else {
        message.error(result.message);
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form layout="vertical" form={form} style={{ marginTop: '2rem' }}>
      <Form.Item
        required
        label="Temporary Password"
        name="tempPassword"
        normalize={(value) => value.trim()}
        rules={[
          {
            required: true,
            message: 'Please input your temporary password!',
          },
        ]}>
        <Input.Password size="large" autoComplete="new-temp-password" />
      </Form.Item>
      <Popover placement="right" trigger="focus" title="Password Complexity" content={popOverContent}>
        <Form.Item
          required
          label="New Password"
          name="password"
          normalize={(value) => value.trim()}
          rules={[
            {
              required: true,
              message: 'Please input your new password!',
            },
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
        required
        label="Confirm Password"
        name="confirmPassword"
        normalize={(value) => value.trim()}
        rules={[
          {
            required: true,
            message: 'Please confirm your new password!',
          },
          {
            validator: async (_, value) => {
              if (!value || value === form.getFieldValue('password')) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords that you entered do not match!'));
            },
          },
        ]}>
        <Input.Password size="large" autoComplete="confirm-new-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" disabled={loading && true} onClick={handleSubmit} className="fullWidth">
        Reset Password {loading && <Spin style={{ marginLeft: '1rem' }} />}
      </Button>
    </Form>
  );
}

export default ResetTempPassword;
