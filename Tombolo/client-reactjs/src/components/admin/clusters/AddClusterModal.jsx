import React, { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Input, Select, Button, Card, Spin, message, Alert, Typography } from 'antd';
import { isEmail } from 'validator';
const { useSelector } = require('react-redux');

import { pingCluster, addCluster } from './clusterUtils';

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

  //Redux
  const {
    authenticationReducer: { user },
  } = useSelector((state) => state);

  // States
  const [requireCredentials, setRequireCredentials] = useState(false);
  const [pingingCluster, setPingingCluster] = useState(false);
  const [clusterReachable, setClusterReachable] = useState(false);
  const [addingCluster, setAddingCluster] = useState(false);
  const [abortController, setAbortController] = useState(null);

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

  // Handle modal cancel
  const handleModalCancel = () => {
    form.resetFields();
    setRequireCredentials(false);
    setClusterReachable(false);
    setDisplayAddClusterModal(false);
    setPingingCluster(false);
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
      const response = await pingCluster({ clusterInfo, abortController });

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

    // Ping the cluster to check if the credentials present
    if (requireCredentials) {
      try {
        const clusterInfo = form.getFieldsValue(['name', 'username', 'password']);
        const response = await pingCluster({ clusterInfo, abortController });

        // Invalid credentials provided
        if (response === 401) {
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

      // Add userinfo to payload
      const creator = { name: `${user.firstName} ${user.lastName}`, email: user.email };
      payload.createdBy = creator;

      // Make API request to add cluster
      const response = await addCluster(payload);
      setClusters([...clusters, response]);
      setRequireCredentials(false);
      message.success('Cluster added successfully');
      form.resetFields();
      setDisplayAddClusterModal(false);
    } catch (err) {
      message.error('Failed to add cluster');
    } finally {
      setAddingCluster(false);
    }
  };

  return (
    <Modal
      open={displayAddClusterModal}
      onCancel={handleModalCancel}
      maskClosable={false}
      width={800}
      closable={false}
      footer={[
        <Button key="cancel" onClick={handleModalCancel} type="primary" ghost>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={submitNewCluster}
          disabled={!clusterReachable || addingCluster}
          loading={addingCluster}>
          {`Sav${addingCluster ? 'ing' : 'e'}`}
        </Button>,
        addingCluster && (
          <div key="alert" style={{ padding: '5px', color: 'var(--dark)' }}>
            Please stand by. This may take a moment.
          </div>
        ),
      ]}>
      <Card size="small">
        <Spin tip={`Pinging Cluster .. `} spinning={pingingCluster}>
          <Form layout="vertical" form={form} loading>
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

            <Form.Item
              label="Admin Emails"
              name="adminEmails"
              required
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.length === 0) {
                      return Promise.reject(new Error('Please add at least one email!'));
                    }
                    if (value.length > 20) {
                      return Promise.reject(new Error('Too many emails'));
                    }
                    if (!value.every((v) => isEmail(v))) {
                      return Promise.reject(new Error('One or more emails are invalid'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}>
              <Select
                suffixIcon={null}
                mode="tags"
                allowClear
                placeholder="Enter a comma-delimited list of email addresses"
                tokenSeparators={[',', ' ']}
              />
            </Form.Item>

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
    </Modal>
  );
}

export default AddClusterModal;
