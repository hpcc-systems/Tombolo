import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Input, Button, Spin, Popover } from 'antd';

import { Constants } from '../common/Constants';
import { getDeviceInfo } from './utils';
import passwordComplexityValidator from '../common/passwordComplexityValidator';
import { setUser } from '../common/userStorage';
import { handleError } from '../common/handleResponse';
import authService from '@/services/auth.service';

const ResetTempPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [popOverContent, setPopOverContent] = useState<any>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);
  const [form] = Form.useForm();

  const finishedTypingRef = useRef(false);
  const isFirstLoad = useRef(true);

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

  const validatePassword = (value: any, checkOldPassword?: boolean) => {
    let pw = value;
    if (!value) pw = '';

    if (checkOldPassword) {
      setPopOverContent(
        (
          passwordComplexityValidator({
            password: pw,
            user: userDetails,
            oldPasswordCheck: false,
            newUser: userDetails?.newUser || false,
          } as any) as any
        ).content
      );
    } else {
      setPopOverContent(
        (
          passwordComplexityValidator({
            password: pw,
            user: userDetails,
            newUser: userDetails?.newUser || false,
          } as any) as any
        ).content
      );
    }
  };

  useEffect(() => {
    const url = window.location.href;
    const urlParts = url.split('/');
    const token = urlParts[urlParts.length - 1];
    setResetToken(token);
  }, []);

  const onLoad = useCallback(async () => {
    try {
      const response = await authService.getUserDetailsWithVerificationCode(resetToken);

      if (!response || !response.email || !response.firstName || !response.lastName) {
        throw new Error('Invalid user data received');
      }

      setUserDetails(response);
    } catch {
      setLoadError(true);
      setUserDetails({});
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

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const resetData = { ...values, token: resetToken, deviceInfo: getDeviceInfo() };
      const response: any = await authService.resetTempPassword(resetData);

      const user = response.data || response;
      user.isAuthenticated = true;

      setUser(user);
      window.location.href = '/';
    } catch (err: any) {
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
        normalize={(value: any) => value.trim()}
        rules={[{ required: true, message: 'Please input your temporary password!' }]}>
        <Input.Password size="large" autoComplete="new-temp-password" />
      </Form.Item>

      <Popover placement="right" trigger="focus" title="Password Complexity" content={popOverContent}>
        <Form.Item
          required
          label="New Password"
          name="password"
          normalize={(value: any) => value.trim()}
          rules={[
            { required: true, message: 'Please input your new password!' },
            { max: 64, message: 'Maximum of 64 characters allowed' },
            () => ({
              validator(_, value: any) {
                if (!value) {
                  return Promise.reject();
                }

                let result: any;

                if (finishedTypingRef.current) {
                  result = passwordComplexityValidator({
                    password: value,
                    user: userDetails,
                    oldPasswordCheck: false,
                    newUser: userDetails?.newUser || false,
                  } as any) as any;
                } else {
                  result = passwordComplexityValidator({
                    password: value,
                    user: userDetails,
                    newUser: userDetails?.newUser || false,
                  } as any) as any;
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
        normalize={(value: any) => value.trim()}
        dependencies={['password']}
        rules={[
          { required: true, message: 'Please confirm your password!' },
          ({ getFieldValue }: any) => ({
            validator(_, value: any) {
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
};

export default ResetTempPassword;
