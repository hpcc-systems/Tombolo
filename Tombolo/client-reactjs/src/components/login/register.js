import React from 'react';
import { Form } from 'antd';
import RegisterUserForm from './registerUserForm';
import { getDeviceInfo } from './utils';
import { authActions } from '../../redux/actions/Auth';

import { Constants } from '../common/Constants';

const Register = () => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      values.deviceInfo = getDeviceInfo();
      const result = await authActions.registerBasicUser(values);

      if (result && result.type === Constants.LOGIN_SUCCESS) {
        window.location.href = '/';
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <RegisterUserForm form={form} onFinish={onFinish} msEnabled={false} />
      <p style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}>
        <span>Already have an account?</span> <a href="/login">Login</a>
      </p>
    </>
  );
};

export default Register;
