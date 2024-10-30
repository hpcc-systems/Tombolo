import React, { useState, useEffect } from 'react';
import { Form, Steps, Button, Divider, Badge, message } from 'antd';
import RegisterUserForm from '../login/registerUserForm';
import { getDeviceInfo } from '../login/utils';
import { authActions } from '../../redux/actions/Auth';
import { Constants } from '../common/Constants';
import BasicLayout from '../common/BasicLayout';
import { Route, Switch } from 'react-router-dom';
import { FormOutlined, LoadingOutlined } from '@ant-design/icons';
import { SolutionOutlined, UserOutlined } from '@ant-design/icons';
import InstanceSettingsForm from './instanceSettings';
import ReviewForm from './reviewForm';

const Wizard = () => {
  //forms
  const [userForm] = Form.useForm();
  const [instanceForm] = Form.useForm();

  //state to control current step
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  //error indicators
  const [userErrors, setUserErrors] = useState(false);
  const [instanceErrors, setInstanceErrors] = useState(false);

  //need to have the form instances always exist so we need to control visibility based on current with states
  //if we try and just load them dynamically we lose the form data upon switching the screen
  const [userformVisible, setUserFormVisible] = useState(true);
  const [instanceFormVisible, setInstanceFormVisible] = useState(false);
  const [reviewFormVisible, setReviewFormVisible] = useState(false);

  useEffect(() => {
    if (current === 0) {
      setUserFormVisible(true);
      setInstanceFormVisible(false);
      setReviewFormVisible(false);
    } else if (current === 1) {
      setUserFormVisible(false);
      setInstanceFormVisible(true);
      setReviewFormVisible(false);
    } else if (current === 2) {
      setUserFormVisible(false);
      setInstanceFormVisible(false);
      setReviewFormVisible(true);
    }
  }, [current, userErrors, instanceErrors]);

  const next = async () => {
    try {
      //dont allow to go to next step if there are errors
      if (current === 0) {
        await userForm.validateFields();
        await setUserErrors(false);
      }
      if (current === 1) {
        await instanceForm.validateFields();
        await setInstanceErrors(false);
      }
      setCurrent(current + 1);
    } catch (e) {
      console.log(e);
    }
  };
  const prev = () => {
    setCurrent(current - 1);
  };

  const steps = [
    {
      title: <>Owner Settings {userErrors && <Badge color="red" />}</>,
      icon: <UserOutlined />,
    },
    {
      title: <>Instance Settings {instanceErrors && <Badge color="red" />}</>,
      icon: <FormOutlined />,
    },
    {
      title: 'Review & Submit',
      icon: !submitting ? <SolutionOutlined /> : <LoadingOutlined />,
    },
  ];

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

  const onSubmit = async () => {
    try {
      setSubmitting(true);

      //check for errors in fields
      await userForm.validateFields();
      await instanceForm.validateFields();

      setSubmitting(false);
    } catch (e) {
      console.log(e);
      message.error('Error validating form fields, please check and try again');
    } finally {
      setSubmitting(false);
    }
  };

  const WizardContent = () => {
    return (
      <BasicLayout
        content={
          <>
            <h3 style={{ textAlign: 'center' }}>
              Welcome to Tombolo, to get started, we need to register an owner account, and set some instance settings.
            </h3>
            <Divider />
            <div style={{ width: '100%', display: 'flex', flexWrap: 'nowrap' }}>
              <div style={{ width: '25%', minHeight: '25rem' }}>
                <Steps current={current} items={steps} direction="vertical" style={{ height: '100%' }} size="large" />
              </div>
              <div style={{ width: '75%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: userformVisible ? 'block' : 'none' }}>
                    <RegisterUserForm form={userForm} onFinish={onFinish} msEnabled={false} ownerRegistration={true} />
                  </div>
                  <div style={{ display: instanceFormVisible ? 'block' : 'none' }}>
                    <InstanceSettingsForm instanceForm={instanceForm} />
                  </div>
                  <div style={{ display: reviewFormVisible ? 'block' : 'none' }}>
                    <ReviewForm userForm={userForm} instanceForm={instanceForm} current={current} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
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
                    <Button
                      type="primary"
                      onClick={onSubmit}
                      size="large"
                      disabled={userErrors || instanceErrors || submitting}>
                      Submit {submitting && <LoadingOutlined style={{ marginLeft: '1rem' }} />}
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
