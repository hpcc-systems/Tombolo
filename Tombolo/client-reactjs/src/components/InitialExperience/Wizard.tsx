// Library imports
import React, { useState, useEffect } from 'react';
import { Form, Steps, Button, Divider, Card, Space } from 'antd';
import { Route, Switch } from 'react-router-dom';
import {
  FormOutlined,
  SolutionOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

// Local imports
import InstanceSettingsForm from './instanceSettings';
import ReviewForm from './reviewForm';
import wizardService from '@/services/wizard.service';
import RegisterUserForm from '../login/registerUserForm';
import { getDeviceInfo } from '../login/utils';
import BasicLayout from '../common/BasicLayout';
import { handleSuccess, handleError } from '../common/handleResponse';
import type { FormInstance } from 'antd';

// Colors for the steps (aligned with cluster pattern)
const stepColor: Record<string, string> = {
  true: 'var(--success)',
  false: 'var(--danger)',
};

// Icons for the steps (aligned with cluster pattern)
const stepIcon: Record<string, React.ReactNode> = {
  true: <CheckCircleOutlined />,
  false: <CloseCircleOutlined />,
};

const Wizard: React.FC = () => {
  //form instances
  const [userForm] = Form.useForm();
  const [instanceForm] = Form.useForm();

  // States
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [stepMessage, setStepMessage] = useState<any[]>([]);
  const [userFormVisible, setUserFormVisible] = useState(true);
  const [instanceFormVisible, setInstanceFormVisible] = useState(false);
  const [reviewFormVisible, setReviewFormVisible] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [completedSuccessfully, setCompleteSuccessfully] = useState(false);

  useEffect(() => {
    if (currentStep === 0) {
      setInstanceFormVisible(true);
      setUserFormVisible(false);
      setReviewFormVisible(false);
    } else if (currentStep === 1) {
      setUserFormVisible(true);
      setInstanceFormVisible(false);
      setReviewFormVisible(false);
    } else if (currentStep === 2) {
      setReviewFormVisible(true);
      setUserFormVisible(false);
      setInstanceFormVisible(false);
    }
  }, [currentStep]);

  const next = async () => {
    if (currentStep === 0) {
      try {
        await instanceForm.validateFields();
        setCurrentStep(currentStep + 1);
      } catch {
        return;
      }
      return;
    }
    if (currentStep === 1) {
      try {
        await userForm.validateFields();
        setCurrentStep(currentStep + 1);
      } catch {
        return;
      }
      return;
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);

    if (progressVisible) {
      setProgressVisible(false);
      setStepMessage([]);
    }
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
      icon: <SolutionOutlined />,
    },
  ];

  const onSubmit = async () => {
    try {
      setStepMessage([]);
      setSubmitting(true);
      setReviewFormVisible(false);
      setProgressVisible(true);

      const instanceValues = instanceForm.getFieldsValue();
      const userValues = userForm.getFieldsValue();

      const values = {
        ...instanceValues,
        ...userValues,
        deviceInfo: getDeviceInfo(),
      };

      const abortController = new AbortController();
      let processedLength = 0;

      await wizardService.completeFirstRun({
        instanceInfo: values,
        abortController,
        onProgress: (text: string) => {
          const newData = text.substring(processedLength);
          processedLength = text.length;

          if (newData.trim()) {
            const jsonStrings = newData
              .split('\n')
              .filter((str: string) => str.trim() !== '')
              .map((str: string) => str.replace(/^data: /, ''));

            const serverSentEvents = jsonStrings
              .map((str: string) => {
                try {
                  return JSON.parse(str);
                } catch {
                  return null;
                }
              })
              .filter((event: any) => event !== null);

            let hasError = false;
            let errorMessage = '';

            serverSentEvents.forEach((e: any) => {
              if (e.step === 99) {
                hasError = true;
                errorMessage = e.message || 'Setup failed';
              } else if (e.step === 999) {
                setCompleteSuccessfully(true);
                setSubmitting(false);
                handleSuccess('Verification E-mail sent!');
              }
            });

            setStepMessage(prev => [...prev, ...serverSentEvents]);

            if (hasError) {
              setSubmitting(false);
              handleError(new Error(errorMessage));
              return;
            }
          }
        },
      });
    } catch (e) {
      handleError(e as any);
      setSubmitting(false);
    }
  };

  const WizardContent: React.FC = () => {
    return (
      <BasicLayout
        content={
          <>
            <h3 style={{ textAlign: 'center' }}>
              Welcome to Tombolo, to get started, we need to register an owner account, and set some instance settings.
            </h3>
            <Card style={{ marginTop: '2rem' }}>
              {!submitting && !completedSuccessfully && (
                <>
                  <div>
                    <Steps
                      current={currentStep}
                      items={steps}
                      direction="horizontal"
                      style={{ marginBottom: '2rem' }}
                      size="small"
                    />
                  </div>
                  <Divider />
                </>
              )}
              <div>
                <div style={{ display: instanceFormVisible ? 'block' : 'none' }}>
                  <InstanceSettingsForm instanceForm={instanceForm} />
                </div>
                <div style={{ display: userFormVisible ? 'block' : 'none' }}>
                  <RegisterUserForm {...({ form: userForm, msEnabled: false, ownerRegistration: true } as any)} />
                </div>

                <div style={{ display: reviewFormVisible ? 'block' : 'none' }}>
                  <ReviewForm userForm={userForm} instanceForm={instanceForm} currentStep={currentStep} />
                </div>
                <div className="wizardSteps" style={{ display: progressVisible ? 'block' : 'none' }}>
                  {stepMessage.map((step, index) => (
                    <div style={{ color: stepColor[step.success] }} key={index}>
                      {stepIcon[step.success]} {step.message}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginTop: '1rem' }}>
                {(submitting || !completedSuccessfully) && (
                  <Space size="small">
                    {currentStep > 0 && (
                      <Button onClick={() => prev()} size="large">
                        Previous
                      </Button>
                    )}
                    {currentStep < steps.length - 1 && (
                      <Button type="primary" onClick={() => next()} size="large">
                        Next
                      </Button>
                    )}
                    {currentStep === steps.length - 1 && (
                      <Button type="primary" onClick={onSubmit} size="large">
                        Submit
                      </Button>
                    )}
                  </Space>
                )}

                {completedSuccessfully && (
                  <div style={{ marginTop: '1rem' }}>
                    <Button
                      type="primary"
                      onClick={() => {
                        window.location.href = '/';
                      }}
                      size="large">
                      Go to Login Page
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </>
        }
        width="55rem"></BasicLayout>
    );
  };

  return (
    <Switch>
      <Route path="*" component={WizardContent} />
    </Switch>
  );
};

export default Wizard;
