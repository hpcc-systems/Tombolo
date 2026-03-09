// Imports from libraries
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Input, Button, Spin, Popover } from 'antd';

// Local imports
import { Constants } from '../common/Constants';
import { getDeviceInfo } from './utils';
import passwordComplexityValidator from '../common/passwordComplexityValidator';
import { setUser } from '../common/userStorage';
import { handleError } from '../common/handleResponse';
import authService from '@/services/auth.service';

function ResetTempPassword() {
  const [loading, setLoading] = useState(false);
  const [popOverContent, setPopOverContent] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [form] = Form.useForm();

  //ref to track if user is finished typing
  const finishedTypingRef = useRef(false);
  const isFirstLoad = useRef(true);

  //need to detect when user is finished typing to run check previous password validator, otherwise performance is too slow
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isFirstLoad.current) {
        validatePassword(form.getFieldValue('password'), true);
        finishedTypingRef.current = true;
        form.validateFields(['password']);
      } else {
        isFirstLoad.current = false;
      }
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
        passwordComplexityValidator({
          password: pw,
          user: userDetails,
          oldPasswordCheck: false,
          newUser: userDetails?.newUser || false,
        }).content
      );
    } else {
      setPopOverContent(
        passwordComplexityValidator({
          password: pw,
          user: userDetails,
          newUser: userDetails?.newUser || false,
        }).content
      );
    }
  };

  // On component load, get the token from the URL
  useEffect(() => {
    const url = window.location.href;
    const urlParts = url.split('/');
    const token = urlParts[urlParts.length - 1];
    setResetToken(token);
  }, []);

  const onLoad = useCallback(async () => {
    //get user details from service
    try {
      const response = await authService.getUserDetailsWithVerificationCode(resetToken);

      if (!response || !response.email || !response.firstName || !response.lastName) {
        throw new Error('Invalid user data received');
      }

      setUserDetails(response);
    } catch {
      setLoadError(true);
      setUserDetails({}); // Prevent infinite loop by setting to empty object
      handleError(
        'Unable to validate the password reset link. The link may have expired or been copied incorrectly. Please contact your administrator for a new link.'
      );
    }
  }, [resetToken]);

  useEffect(() => {
    if (userDetails === null && resetToken !== null && !loadError) {
      onLoad();
    }
  }, [resetToken, userDetails, loadError, onLoad]);

  // Handle form submission
  const onFinish = async values => {
    try {
      setLoading(true);
      const resetData = {
        ...values,
        token: resetToken,
        deviceInfo: getDeviceInfo(),
      };
      const response = await authService.resetTempPassword(resetData);

      //set isAuthenticated to true so application loads
      const user = response.data || response;
      user.isAuthenticated = true;

      // Save user token to local storage
      setUser(JSON.stringify(user));
      window.location.href = '/';
    } catch (err) {
      // Check if error messages array contains the invalid temp password message
      if (err?.messages?.includes(Constants.RESET_TEMP_PW_INVALID)) {
        handleError('The temporary password you entered is incorrect. Please try again.');
      } else if (err?.messages) {
        handleError(err.messages);
      } else {
        handleError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={onFinish} layout="vertical" form={form} style={{ marginTop: '2rem' }}>
      <Form.Item
        required
        label="Temporary Password"
        name="tempPassword"
        normalize={value => value.trim()}
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
          normalize={value => value.trim()}
          rules={[
            {
              required: true,
              message: 'Please input your new password!',
            },
            {
              max: 64,
              message: 'Maximum of 64 characters allowed',
            },
            () => ({
              validator(_, value) {
                if (!value) {
                  return Promise.reject();
                }

                let result;

                if (finishedTypingRef.current) {
                  result = passwordComplexityValidator({
                    password: value,
                    user: userDetails,
                    oldPasswordCheck: false,
                    newUser: userDetails?.newUser || false,
                  });
                } else {
                  result = passwordComplexityValidator({
                    password: value,
                    user: userDetails,
                    newUser: userDetails?.newUser || false,
                  });
                }

                finishedTypingRef.current = false;

                if (!value || result.errors.length === 1) {
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
            onChange={e => {
              validatePassword(e.target.value);
            }}
            onFocus={e => {
              validatePassword(e.target.value, true);
            }}
            onBlur={e => {
              validatePassword(e.target.value, true);
            }}
          />
        </Form.Item>
      </Popover>
      <Form.Item
        required
        label="Confirm Password"
        name="confirmPassword"
        normalize={value => value.trim()}
        dependencies={['password']}
        rules={[
          {
            required: true,
            message: 'Please confirm your password!',
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords do not match!'));
            },
          }),
        ]}>
        <Input.Password size="large" autoComplete="confirm-new-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" disabled={loading && true} className="fullWidth">
        Reset Password {loading && <Spin style={{ marginLeft: '1rem' }} />}
      </Button>
    </Form>
  );
}

export default ResetTempPassword;
