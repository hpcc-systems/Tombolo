import React, { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Input, Select, Button, Card, Spin, Alert, Typography, Checkbox } from 'antd';

import { pingCluster, checkClusterHealth, addCluster } from './clusterUtils';
import AddClusterSteps from './AddClusterSteps';
import EmailTagInput from '@/components/common/EmailTagInput';
import { handleSuccess } from '@/components/common/handleResponse';

// Constants
const { Option } = Select;
const { Text } = Typography;

function AddClusterModal({
  displayAddClusterModal,
  setDisplayAddClusterModal,
  clusterWhiteList,
  clusters,
  setClusters,
  tombolo_instance_name,
}) {
  // Hooks
  const [form] = Form.useForm();

  // States
  const [requireCredentials, setRequireCredentials] = useState(false);
  const [pingingCluster, setPingingCluster] = useState(false);
  const [clusterReachable, setClusterReachable] = useState(false);
  const [addingCluster, setAddingCluster] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [allowSelfSigned, setAllowSelfSigned] = useState(false);
  // For displaying cluster saving updates
  const [completedSteps, setCompletedSteps] = useState([]);
  const [displaySteps, setDisplaySteps] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedAndRemainingSteps, setCompletedAndRemainingSteps] = useState([]);
  const [errorEncountered, setErrorEncountered] = useState(false);

  // Effects
  useEffect(() => {
    // Create an abort controller
    const controller = new AbortController();
    setAbortController(controller);

    return () => {
      // Clean up AbortController when modal is closed
      controller.abort();
    };
  }, []);

  // Const resetAllCluster adding steps
  const resetAllClusterAddSteps = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setCompletedAndRemainingSteps([]);
    setErrorEncountered(false);
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    form.resetFields();
    setRequireCredentials(false);
    setClusterReachable(false);
    setDisplayAddClusterModal(false);
    setPingingCluster(false);
    setCompletedSteps([]);
    setAddingCluster(false);
    resetAllClusterAddSteps();
  };

  // Available clusters (whitelisted minus already saved)
  const availableClusters = clusterWhiteList.filter((cluster) => {
    return !clusters.find((c) => c.name === cluster.name);
  });

  // Handle cluster change - when select options are changed
  const handleClusterChange = async () => {
    try {
      setClusterReachable(false);
      setPingingCluster(true);

      // If error is present in the name field, clear it
      form.setFields([
        {
          name: 'name',
          errors: [],
        },
      ]);

      const clusterInfo = form.getFieldsValue(['name', 'username', 'password']);
      // const response = await pingCluster({ clusterInfo, abortController });
      const response = await checkClusterHealth({ clusterInfo, abortController });

      // Based on response set if cluster requires credentials
      if (response === 200) {
        setRequireCredentials(false);
      } else {
        setRequireCredentials(true);
      }
      setClusterReachable(true);
    } catch (e) {
      //Cluster is not reachable
      setClusterReachable(false);
      setRequireCredentials(false);
      form.setFields([
        {
          name: 'name',
          errors: ['Unable to establish connection with the cluster'],
        },
      ]);
    } finally {
      setPingingCluster(false);
    }
  };

  // Submit add new cluster form
  const submitNewCluster = async () => {
    // Reset all step related states
    resetAllClusterAddSteps();

    // Validate all the form fields
    let validationErrors = false;
    try {
      await form.validateFields();
    } catch (e) {
      validationErrors = true;
    }

    if (validationErrors) {
      return;
    }

    setDisplaySteps(true);

    // Ping the cluster to check if the credentials present
    if (requireCredentials) {
      try {
        const clusterInfo = form.getFieldsValue(['name', 'username', 'password']);
        const response = await pingCluster({ clusterInfo, abortController });

        // Invalid credentials provided
        if (response === 403) {
          form.setFields([
            {
              name: 'username',
              errors: ['Invalid username or password'],
            },
            {
              name: 'password',
              errors: [''],
            },
          ]);
          return;
        }
      } catch (e) {
        form.setFields([
          {
            name: 'name',
            errors: ['Unable to establish connection with the cluster'],
          },
        ]);
        return;
      }
    }

    try {
      setAddingCluster(true);
      // Get the form values
      const payload = form.getFieldsValue();

      // Make API request to add cluster
      const response = await addCluster({ clusterInfo: payload, abortController });

      if (!response.ok) {
        throw new Error('Failed to add cluster');
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let sendingResponse = true;

        while (sendingResponse) {
          const { done, value } = await reader.read();
          if (done) {
            sendingResponse = false;
          }
          const decodedValue = decoder.decode(value);
          const jsonStrings = decodedValue
            .split('\n')
            .filter((str) => str.trim() !== '')
            .map((str) => str.replace(/^data: /, ''));
          const serverSentEvents = jsonStrings.map((str) => JSON.parse(str));

          // Set completed steps
          setCompletedSteps((prev) => [...prev, ...serverSentEvents]);

          // If server event have cluster key-value pair, then add it to clusters
          serverSentEvents.forEach((event) => {
            //If error encountered, stop the process
            if (event.step === 99) {
              throw new Error(event.message);
            }

            if (event.cluster) {
              setClusters([...clusters, event.cluster]);
              setRequireCredentials(false);
              handleSuccess('Cluster added successfully');
              form.resetFields();
              setDisplayAddClusterModal(false);
              setAddingCluster(false);
              setDisplaySteps(false);
            }
          });
        }
      }
    } catch (err) {
      // If completed step does not have an item with step 99
      // The error occurred outside pre-defined 4 steps
      if (!completedSteps.find((step) => step.step === 99)) {
        setCompletedAndRemainingSteps((prev) => [...prev, { step: 99, message: err.message }]);
      }
      setErrorEncountered(true);
      setDisplaySteps(true);
      setAddingCluster(false);
    }
  };

  return (
    <Modal
      open={displayAddClusterModal}
      onCancel={handleModalCancel}
      maskClosable={false}
      title="Add Cluster"
      width={800}
      closable={true}
      footer={[
        <Button key="cancel" onClick={handleModalCancel} type="primary" ghost>
          Cancel
        </Button>,
        !addingCluster && (
          <Button key="save" type="primary" onClick={submitNewCluster}>
            {errorEncountered ? 'Retry' : 'Save'}
          </Button>
        ),
      ]}>
      <>
        {displaySteps && (
          <AddClusterSteps
            completedSteps={completedSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            completedAndRemainingSteps={completedAndRemainingSteps}
            setCompletedAndRemainingSteps={setCompletedAndRemainingSteps}
            errorEncountered={errorEncountered}
            setErrorEncountered={setErrorEncountered}
          />
        )}

        {!addingCluster && (
          <Card size="small">
            <Spin tip={`Pinging Cluster .. `} spinning={pingingCluster}>
              <Form layout="vertical" form={form}>
                <Form.Item
                  label="Cluster"
                  name="name"
                  required
                  rules={[{ required: true, message: 'Please select a cluster' }]}>
                  <Select onChange={handleClusterChange}>
                    {availableClusters.map((cluster) => (
                      <Option key={cluster.name} value={cluster.name}>
                        {cluster.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label={null} name="allowSelfSigned" valuePropName="checked">
                  <Checkbox name="allowSelfSigned" onChange={() => setAllowSelfSigned(!allowSelfSigned)}>
                    Allow Self Signed Certificates
                  </Checkbox>
                </Form.Item>

                {allowSelfSigned && (
                  <a
                    href="https://hpcc-systems.github.io/Tombolo/docs/User-Guides/self-signed-certs"
                    target="_blank"
                    rel="noreferrer">
                    See instructions for self signed certificates
                  </a>
                )}

                <EmailTagInput label="Admin Emails" name="adminEmails" required />

                {requireCredentials && (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          label="Username"
                          name="username"
                          required
                          rules={[{ required: true, message: 'Please enter a username' }]}>
                          <Input autoComplete="off" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <input type="text" style={{ display: 'none' }} />
                        <Form.Item
                          label="Password"
                          name="password"
                          required
                          rules={[{ required: true, message: 'Please enter a password' }]}>
                          <Input.Password autoComplete="new-password" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )}
              </Form>
            </Spin>
            {!requireCredentials && clusterReachable && tombolo_instance_name && !addingCluster && (
              <Alert
                size="small"
                banner
                type="info"
                style={{ padding: '5px 15px' }}
                message={
                  <span>
                    Tombolo will execute jobs in the HPCC cluster using the username{' '}
                    <Text strong>{tombolo_instance_name}</Text>
                  </span>
                }
              />
            )}
          </Card>
        )}
      </>
    </Modal>
  );
}

export default AddClusterModal;
