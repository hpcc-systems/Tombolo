import React, { useState } from 'react';
import { Form, Steps, Button, message, Divider } from 'antd';
import RegisterUserForm from '../login/registerUserForm';
import { getDeviceInfo } from '../login/utils';
import { authActions } from '../../redux/actions/Auth';
import { Constants } from '../common/Constants';
import BasicLayout from '../common/BasicLayout';
import { Route, Switch } from 'react-router-dom';
import { FormOutlined, LoadingOutlined } from '@ant-design/icons';
import { CheckCircleOutlined, SolutionOutlined, UserOutlined } from '@ant-design/icons';

const Wizard = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  console.log(setSubmitting);
  const [current, setCurrent] = useState(0);
  const next = () => {
    setCurrent(current + 1);
  };
  const prev = () => {
    setCurrent(current - 1);
  };

  const steps = [
    {
      title: 'Owner Account',
      icon: <UserOutlined />,
    },
    {
      title: 'System Settings',
      icon: <FormOutlined />,
    },
    {
      title: 'Review & Submit',
      icon: !submitting ? <SolutionOutlined /> : <LoadingOutlined />,
    },
    {
      title: 'Complete',
      icon: <CheckCircleOutlined />,
    },
  ];

  const onChange = (value) => {
    setCurrent(value);
  };
  const onFinish = async (values) => {
    try {
      values.deviceInfo = getDeviceInfo();
      const result = await authActions.registerOwner(values);

      if (result && result.type === Constants.LOGIN_SUCCESS) {
        //reload page
        window.location.reload(false);
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
            <h3 style={{ textAlign: 'center' }}>
              Welcome to Tombolo, to get started, we need to register an owner account, and set some system settings.
            </h3>
            <Divider />
            <div style={{ width: '100%', display: 'flex', flexWrap: 'nowrap' }}>
              <div style={{ width: '25%', minHeight: '25rem' }}>
                <Steps
                  current={current}
                  items={steps}
                  direction="vertical"
                  onChange={onChange}
                  style={{ height: '100%' }}
                  size="large"
                />
              </div>
              <div style={{ width: '75%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {current === 0 && (
                    <RegisterUserForm form={form} onFinish={onFinish} msEnabled={false} ownerRegistration={true} />
                  )}
                  {current === 1 && <>Step 2</>}
                  {current === 2 && <>Step 3</>}
                  {current === 3 && <>Step 4</>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  {current > 0 && (
                    <Button
                      style={{
                        margin: '0 8px',
                      }}
                      onClick={() => prev()}
                      size="large">
                      Previous
                    </Button>
                  )}
                  {current < steps.length - 1 && (
                    <Button type="primary" onClick={() => next()} size="large">
                      Next
                    </Button>
                  )}
                  {current === steps.length - 1 && (
                    <Button type="primary" onClick={() => message.success('Processing complete!')} size="large">
                      Done
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        }
        width="55rem"></BasicLayout>
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
