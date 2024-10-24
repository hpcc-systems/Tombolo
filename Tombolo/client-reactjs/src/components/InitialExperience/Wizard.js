// Libraries
import React, { useState } from 'react';
import { Form, message } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

// Local imoprts
import RegisterUserForm from '../login/registerUserForm';
import { getDeviceInfo } from '../login/utils';
import { authActions } from '../../redux/actions/Auth';
import BasicLayout from '../common/BasicLayout';
import { Route, Switch } from 'react-router-dom';

const Wizard = () => {
  // Hooks
  const [form] = Form.useForm();

  // States
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // When register button is clicked
  const onFinish = async (values) => {
    try {
      values.deviceInfo = getDeviceInfo();
      await authActions.registerOwner(values);
      setRegistrationComplete(true);
    } catch (e) {
      message.error(e.message);
    }
  };

  // Page content
  const pageContent = (
    <>
      {registrationComplete ? (
        <div>
          <p style={{ width: '100%', textAlign: 'center', marginTop: '1rem', fontSize: '1.1rem' }}>
            <CheckCircleFilled style={{ marginRight: '1rem', color: 'green' }} twoToneColor="#eb2f96" fill="green" />
            Registration complete. Please check your email to verify your account.
          </p>
        </div>
      ) : (
        <>
          <h3>Welcome to Tombolo, to get started, please register your ownership account.</h3>
          <RegisterUserForm form={form} onFinish={onFinish} msEnabled={false} />
        </>
      )}
    </>
  );

  // Wizard content
  const WizardContent = () => {
    return <BasicLayout content={pageContent} width="40rem"></BasicLayout>;
  };

  //return router with all paths leading to the wizard content
  return (
    <Switch>
      <Route path="*" component={WizardContent} />
    </Switch>
  );
};

export default Wizard;
