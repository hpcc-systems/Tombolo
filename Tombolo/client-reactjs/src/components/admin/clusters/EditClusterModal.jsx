import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Card, Form, Button, Row, Col, Input, Select, Checkbox, message } from 'antd';
import { isEmail } from 'validator';
import { pingCluster, updateCluster } from './clusterUtils';
import './clusters.css';

function EditClusterModal({ displayEditClusterModal, setDisplayEditClusterModal, selectedCluster, setClusters }) {
  // Hooks
  const [form] = Form.useForm();

  //Redux
  const {
    authenticationReducer: { user },
  } = useSelector((state) => state);

  // States
  const [updateCredentials, setUpdateCredentials] = useState(false);

  // Effects
  useEffect(() => {
    if (!selectedCluster) {
      return;
    }

    form.setFieldsValue({
      clusterName: `${selectedCluster?.name} [ ${selectedCluster?.thor_host} ]`,
      username: selectedCluster?.username,
      adminEmails: selectedCluster?.adminEmails,
    });
  }, [selectedCluster]);

  // Handle modal cancel
  const handleModalCancel = () => {
    form.resetFields();
    setUpdateCredentials(false);
    setDisplayEditClusterModal(false);
  };

  // Handle update cluster
  const handleClusterUpdate = async () => {
    let validationErrorsExist = false;
    try {
      await form.validateFields();
    } catch (err) {
      validationErrorsExist = true;
    }

    if (validationErrorsExist) {
      return;
    }

    // If updating credentials check cluster reachability
    let clusterReachable = true;
    if (updateCredentials) {
      try {
        const clusterInfo = form.getFieldsValue(['username', 'password']);
        clusterInfo.name = selectedCluster.name;
        const response = await pingCluster(clusterInfo);

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
        clusterReachable = false;
        form.setFields([
          {
            name: 'clusterName',
            errors: ['Unable to establish connection with the cluster'],
          },
        ]);
      }
    }

    if (!clusterReachable) {
      return;
    }

    // Cluster is reachable, update the cluster
    try {
      const fromValues = form.getFieldsValue();

      // Add updated by info
      fromValues.updatedBy = { name: `${user.firstName} ${user.lastName}`, email: user.email };
      const updatedInfo = await updateCluster({ id: selectedCluster.id, clusterInfo: fromValues });
      setClusters((clusters) => clusters.map((cluster) => (cluster.id === updatedInfo.id ? updatedInfo : cluster)));

      message.success('Cluster updated successfully');
      handleModalCancel();
    } catch (err) {
      message.error('Failed to update cluster');
    }
  };
  return (
    <Modal
      open={displayEditClusterModal}
      destroyOnClose={true}
      width={800}
      closable={false}
      footer={[
        <Button type="primary" ghost key="cancel" onClick={handleModalCancel}>
          Cancel
        </Button>,
        <Button type="primary" key="update" onClick={handleClusterUpdate}>
          Update
        </Button>,
      ]}>
      <Card size="small">
        <Form form={form} layout="vertical">
          <Form.Item name="clusterName" label="Cluster">
            <Input disabled />
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

          {updateCredentials && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Username"
                  name="username"
                  required
                  rules={[{ required: true, message: 'Please enter username' }]}>
                  <Input autoComplete="off" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <input type="text" style={{ display: 'none' }} />
                <Form.Item
                  label="Password"
                  name="password"
                  required
                  rules={[{ required: true, message: 'Please enter password' }]}>
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Checkbox to update credentials only if the user wants to*/}
          <Form.Item>
            <Checkbox checked={updateCredentials} onChange={(e) => setUpdateCredentials(e.target.checked)}>
              {`${selectedCluster?.username ? 'Update' : 'Add'} credentials`}
            </Checkbox>
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
}

export default EditClusterModal;
