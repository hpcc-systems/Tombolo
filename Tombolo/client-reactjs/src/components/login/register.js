import React, { useState, useEffect } from 'react';
import { Form, message } from 'antd';
import { CheckCircleFilled, LoadingOutlined, CloseCircleFilled } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

import RegisterUserForm from './registerUserForm';
import { getDeviceInfo } from './utils';
import { authActions } from '../../redux/actions/Auth';
import { verifyEmail } from './utils';

const Register = () => {
  const [form] = Form.useForm();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [regId, setRegId] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(null);
  const location = useLocation();

  // When component loads look for regId in the url
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('regId');

    if (id) {
      setRegId(id);
    }
  }, [location]);

  // When regId is set, verify the email
  useEffect(() => {
    if (regId) {
      setVerifying(true);
      const verifyUserAc = async () => {
        try {
          const response = await verifyEmail(regId);

          if (!response.success) {
            throw new Error(response?.data?.message || 'Verification failed');
          }

          message.success('Verification completed successfully');
          setRegistrationComplete(true);
          setVerifying(false);
          localStorage.setItem('user', JSON.stringify(response.data));
          window.location.href = '/';
        } catch (err) {
          setVerifying(false);
          setVerificationFailed(err.message);
        }
      };

      verifyUserAc(regId);
    }
  }, [regId]);

  // When form is submitted
  const onFinish = async (values) => {
    try {
      values.deviceInfo = getDeviceInfo();
      authActions.registerBasicUser(values);

      setRegistrationComplete(true);
    } catch (e) {
      setVerificationFailed(e.message);
    }
  };

  return (
    <>
      {regId ? (
        <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          {verifying && (
            <>
              <LoadingOutlined style={{ marginRight: '1rem' }} />
              <div>Verifying your E-mail</div>
            </>
          )}
          {verificationFailed && (
            <div>
              <p style={{ width: '100%', textAlign: 'center', marginTop: '1rem', fontSize: '1.1rem' }}>
                <CloseCircleFilled style={{ marginRight: '1rem', color: 'red' }} twoToneColor="#eb2f96" fill="red" />
                {verificationFailed}
              </p>
            </div>
          )}
        </div>
      ) : registrationComplete ? (
        <div>
          <p style={{ width: '100%', textAlign: 'center', marginTop: '1rem', fontSize: '1.1rem' }}>
            <CheckCircleFilled style={{ marginRight: '1rem', color: 'green' }} twoToneColor="#eb2f96" fill="green" />
            Registration complete. Please check your email to verify your account.
          </p>
        </div>
      ) : (
        <>
          <RegisterUserForm form={form} onFinish={onFinish} msEnabled={true} />
          <p style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}>
            <span>Already have an account?</span> <a href="/login">Login</a>
          </p>
        </>
      )}
    </>
  );
};

export default Register;
