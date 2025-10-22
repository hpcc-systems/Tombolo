import { useState, useEffect } from 'react';
import { Form, message } from 'antd';
import { CheckCircleFilled, LoadingOutlined, CloseCircleFilled } from '@ant-design/icons';
import { useLocation, useHistory, Link } from 'react-router-dom';

import RegisterUserForm from './registerUserForm';
import { getDeviceInfo } from './utils';
import { verifyEmail } from './utils';
import { setUser } from '../common/userStorage';

import { registerBasicUser } from '@/redux/slices/AuthSlice';
import { useDispatch } from 'react-redux';

import styles from './login.module.css';

const Register = () => {
  const dispatch = useDispatch();
  const history = useHistory();

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

          message.success('Your email has been verified!');
          setRegistrationComplete(true);
          setVerifying(false);
          setUser(JSON.stringify(response.data));
          history.push('/');
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
      const res = await dispatch(registerBasicUser(values));

      if (!registerBasicUser.fulfilled.match(res)) {
        return;
      }

      setRegistrationComplete(true);
    } catch (e) {
      setVerificationFailed(e.message);
    }
  };

  return (
    <>
      {regId ? (
        <div className={styles.verifying_container}>
          {verifying && (
            <>
              <LoadingOutlined style={{ marginRight: '1rem' }} />
              <div>Verifying your E-mail</div>
            </>
          )}
          {verificationFailed && (
            <div>
              <p className={styles.helperLink} style={{ fontSize: '1.1rem' }}>
                <CloseCircleFilled style={{ marginRight: '1rem', color: 'red' }} twoToneColor="#eb2f96" fill="red" />
                {verificationFailed}
              </p>
            </div>
          )}
        </div>
      ) : registrationComplete ? (
        <div>
          <p className={styles.helperLink} style={{ fontSize: '1.1rem' }}>
            <CheckCircleFilled style={{ marginRight: '1rem', color: 'green' }} twoToneColor="#eb2f96" fill="green" />
            Registration complete. Please check your email to verify your account.
          </p>
        </div>
      ) : (
        <>
          <RegisterUserForm form={form} onFinish={onFinish} />
          <p className={styles.helperLink}>
            <span>Already have an account?</span> <Link to="/login">Login</Link>
          </p>
        </>
      )}
    </>
  );
};

export default Register;
