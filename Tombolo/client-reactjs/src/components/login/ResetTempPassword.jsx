/* eslint-disable unused-imports/no-unused-imports */
/* eslint-disable unused-imports/no-unused-vars */
// Imports from libraries
import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Spin, Popover } from 'antd';

// Local imports
import { getDeviceInfo } from './utils';
import passwordComplexityValidator from '../common/passwordComplexityValidator';
import { setUser } from '../common/userStorage';
import { handleError } from '../common/handleResponse';
import authService from '@/services/auth.service';

function ResetTempPassword({ email }) {
  const [loading, setLoading] = useState(false);
  const [popOverContent, setPopOverContent] = useState(null);
  // const [resetToken, setResetToken] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [form] = Form.useForm();

  //ref to track if user is finished typing
  const finishedTypingRef = useRef(false);
  const isFirstLoad = useRef(true);

  //need to detect when user is finished typing to run check previous password validator, otherwise perofrmance is too slow
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
          generateContent: true,
          user: userDetails,
          oldPasswordCheck: true,
          newUser: userDetails.newUser,
        })
      );
    } else {
      setPopOverContent(
        passwordComplexityValidator({
          password: pw,
          generateContent: true,
          user: userDetails,
          newUser: userDetails.newUser,
        })
      );
    }
  };
  // On component load, get the token from the URL
  // useEffect(() => {
  //   const url = window.location.href;
  //   const urlParts = url.split('/');
  //   const token = urlParts[urlParts.length - 1];
  //   setResetToken(token);
  // }, []);

  // const onLoad = async () => {
  //   //get user details from service
  //   try {
  //     const response = await authService.getUserDetailsWithVerificationCode(resetToken);

  //     if (!response.success) {
  //       if (response.message) {
  //         handleError(response.message);
  //       } else {
  //         handleError('An undefined error occurred. Please try again later');
  //       }
  //       return;
  //     }

  //     setUserDetails(response.data?.user || response.user);
  //   } catch (err) {
  //     handleError(err.message);
  //   }
  // };

  // useEffect(() => {
  //   if (userDetails === null && resetToken !== null) {
  //     onLoad();
  //   }
  // }, [resetToken, userDetails]);

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
      // values.token = resetToken;
      const resetData = {
        ...values,
        email,
        deviceInfo: getDeviceInfo(),
      };
      const user = await authService.resetTempPassword(resetData);

      //set isAuthenticated to true so application loads
      user.isAuthenticated = true;

      // Save user token to local storage
      setUser(JSON.stringify(user));
      window.location.href = '/';
    } catch (err) {
      handleError(err.message);
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
      <Form.Item required label="New Password" name="password" normalize={(value) => value.trim()}>
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
      <Form.Item required label="Confirm Password" name="confirmPassword" normalize={(value) => value.trim()}>
        <Input.Password size="large" autoComplete="confirm-new-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" disabled={loading && true} onClick={handleSubmit} className="fullWidth">
        Reset Password {loading && <Spin style={{ marginLeft: '1rem' }} />}
      </Button>
    </Form>
  );
}

export default ResetTempPassword;
