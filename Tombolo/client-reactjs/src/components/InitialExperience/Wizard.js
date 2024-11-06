/* eslint-disable unused-imports/no-unused-imports */
import React, { useState, useEffect } from 'react';
import { Form, Steps, Button, Divider, message, Card } from 'antd';
import RegisterUserForm from '../login/registerUserForm';
import { authHeader } from '../common/AuthHeader';
import { getDeviceInfo } from '../login/utils';
import { authActions } from '../../redux/actions/Auth';
import BasicLayout from '../common/BasicLayout';
import { Route, Switch } from 'react-router-dom';
import { FormOutlined, LoadingOutlined, SolutionOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import InstanceSettingsForm from './instanceSettings';
import ReviewForm from './reviewForm';

const Wizard = () => {
  //forms
  const [userForm] = Form.useForm();
  const [instanceForm] = Form.useForm();

  //state to control current step
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  //state to relay message
  const [stepMessage, setStepMessage] = useState([]);

  //need to have the form instances always exist so we need to control visibility based on current with states
  //if we try and just load them dynamically we lose the form data upon switching the screen
  const [userformVisible, setUserFormVisible] = useState(true);
  const [instanceFormVisible, setInstanceFormVisible] = useState(false);
  const [reviewFormVisible, setReviewFormVisible] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (current === 0) {
      setUserFormVisible(false);
      setInstanceFormVisible(true);
      setReviewFormVisible(false);
    } else if (current === 1) {
      setUserFormVisible(true);
      setInstanceFormVisible(false);
      setReviewFormVisible(false);
    } else if (current === 2) {
      setUserFormVisible(false);
      setInstanceFormVisible(false);
      setReviewFormVisible(true);
    }
  }, [current]);

  const next = async () => {
    try {
      //dont allow to go to next step if there are errors
      if (current === 0) {
        await instanceForm.validateFields();
      }
      if (current === 1) {
        await userForm.validateFields();
      }
      setCurrent(current + 1);
    } catch (e) {
      message.error('Error validating form fields, please check and try again');
    }
  };
  const prev = () => {
    setCurrent(current - 1);
  };

  const steps = [
    {
      title: <>Instance Settings</>,
      icon: <FormOutlined />,
    },
    {
      title: <>Owner Settings</>,
      icon: <UserOutlined />,
    },

    {
      title: 'Review & Submit',
      icon: !submitting ? <SolutionOutlined /> : <LoadingOutlined />,
    },
  ];

  const onSubmit = async () => {
    try {
      await setSubmitting(true);
      await setReviewFormVisible(false);
      await setProgressVisible(true);

      let newStepMessage = [];
      newStepMessage.push({ step: 1, message: 'Saving instance settings', icon: null });
      await setStepMessage(newStepMessage);

      //check for errors in fields
      await userForm.validateFields();
      await instanceForm.validateFields();

      //first, submit the instance settings
      //then try to submit the instance form
      let instanceValues = instanceForm.getFieldsValue();

      const url = '/api/wizard/firstRun';

      const response = await fetch(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ instanceValues }),
        },
        { headers: authHeader() }
      );

      if (!response.ok) {
        throw new Error('Failed to create instance settings');
      }
      //update step 1 icon to checkoutlined
      newStepMessage[0].icon = (
        <CheckCircleOutlined style={{ marginLeft: '1rem', color: 'green' }} twoToneColor="#eb2f96" fill="green" />
      );
      newStepMessage.push({ step: 2, message: 'Creating Owner Account', icon: null });
      await setStepMessage(newStepMessage);

      //Now try to submit the user form
      let userValues = userForm.getFieldsValue();
      userValues.deviceInfo = getDeviceInfo();

      const userResult = await authActions.registerOwner(userValues);

      if (userResult?.success === true) {
        newStepMessage[1].icon = (
          <CheckCircleOutlined style={{ marginLeft: '1rem', color: 'green' }} twoToneColor="#eb2f96" fill="green" />
        );
        newStepMessage.push({
          step: 3,
          message: 'Success!',
          icon: (
            <CheckCircleOutlined style={{ marginLeft: '1rem', color: 'green' }} twoToneColor="#eb2f96" fill="green" />
          ),
        });
        setStepMessage(newStepMessage);
        setComplete(true);
      } else {
        setReviewFormVisible(true);
        setProgressVisible(false);
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
    } catch (e) {
      console.log(e);
      message.error('Error validating form fields, please check and try again');
      setSubmitting(false);
      setReviewFormVisible(true);
      setProgressVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Wizard content
  const WizardContent = () => {
    return (
      <BasicLayout
        content={
          <>
            <h3 style={{ textAlign: 'center' }}>
              Welcome to Tombolo, to get started, we need to register an owner account, and set some instance settings.
            </h3>
            {/* <Divider /> */}
            <Card style={{ marginTop: '2rem' }}>
              <div>
                <Steps current={current} items={steps} direction="horizontal" style={{ marginBottom: '2rem' }} />
              </div>
              <Divider />
              <div>
                <div style={{ display: instanceFormVisible ? 'block' : 'none' }}>
                  <InstanceSettingsForm instanceForm={instanceForm} />
                </div>
                <div style={{ display: userformVisible ? 'block' : 'none' }}>
                  <RegisterUserForm form={userForm} msEnabled={false} ownerRegistration={true} />
                </div>

                <div style={{ display: reviewFormVisible ? 'block' : 'none' }}>
                  <ReviewForm userForm={userForm} instanceForm={instanceForm} current={current} />
                </div>
                <div className="wizardSteps" style={{ display: progressVisible ? 'block' : 'none' }}>
                  {stepMessage.map((step, index) => (
                    <>
                      <div key={index}>
                        Step {step.step}: {step.message} {step.icon}
                      </div>
                      <br />
                    </>
                  ))}

                  {complete && (
                    <p>
                      Registration complete, please check your owner account email to verify your account and log in!
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
                {!complete && (
                  <>
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
                      <Button type="primary" onClick={onSubmit} size="large" disabled={submitting}>
                        Submit {submitting && <LoadingOutlined style={{ marginLeft: '1rem' }} />}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
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
