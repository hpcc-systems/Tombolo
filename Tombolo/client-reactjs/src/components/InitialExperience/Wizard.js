import React from 'react';
import { Form } from 'antd';
import RegisterUserForm from '../login/registerUserForm';
import { getDeviceInfo } from '../login/utils';
import { authActions } from '../../redux/actions/Auth';
import { Constants } from '../common/Constants';
import BasicLayout from '../common/BasicLayout';
import { Route, Switch } from 'react-router-dom';

const Wizard = () => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      values.deviceInfo = getDeviceInfo();
      const result = await authActions.registerOwner(values);

      if (result && result.type === Constants.LOGIN_SUCCESS) {
        //reload page
        window.location.href = '/';
      }
    } catch (e) {
      console.log(e);
    }
  };

  const WizardContent = () => {
    return (
      <BasicLayout
        content={
          <>
            <h3>Welcome to Tombolo, to get started, please register your ownership account.</h3>
            <RegisterUserForm form={form} onFinish={onFinish} msEnabled={false} />
          </>
        }
        width="40rem"></BasicLayout>
    );
  };

  //return router with all paths leading to the wizard content
  return (
    <Switch>
      <Route path="*" component={WizardContent} />
    </Switch>
  );
};

export default Wizard;
