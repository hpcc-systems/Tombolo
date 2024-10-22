import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Row, Col, Card, message } from 'antd';
import { useSelector } from 'react-redux';
import { createUser } from './Utils';

const { Option } = Select;

function AddUserModal({ displayAddUserModal, setDisplayAddUserModal, roles, setUsers, filters, setFilteredUsers }) {
  // Handle close modal
  const handleCancel = () => {
    setDisplayAddUserModal(false);
    form.resetFields();
  };

  // Use effect
  useEffect(() => {
    // Reset form fields when modal is closed
  }, [displayAddUserModal]);

  // Form Instance
  const [form] = Form.useForm();

  // Get applications fro redux
  const {
    applicationReducer: { applications },
  } = useSelector((state) => state);

  // Handle form submission - use async await
  const handleFormSubmission = async () => {
    try {
      // Validate form fields
      const values = await form.validateFields();

      if (!values.roles) {
        values.roles = [];
      }

      if (!values.applications) {
        values.applications = [];
      }

      // Create user
      const newUser = await createUser(values);
      setUsers((prev) => [newUser, ...prev]);

      // if no filters add new user to filtered user
      if (Object.keys(filters).length === 0) {
        setFilteredUsers((prev) => [newUser, ...prev]);
      }

      // Reset from fields and close the modal
      form.resetFields();
      message.success('User created successfully');
      setDisplayAddUserModal(false);
    } catch (error) {
      message.error('Failed to create user');
    }
  };

  return (
    <Modal
      open={displayAddUserModal}
      width={800}
      maskClosable={false}
      onCancel={handleCancel}
      title="Add new user"
      onOk={handleFormSubmission}>
      <Card>
        <Form layout="vertical" form={form}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                required
                rules={[
                  {
                    required: true,
                    message: 'Please input first name!',
                  },
                  {
                    min: 2,
                    message: 'First name must be at least 2 characters',
                  },
                  {
                    max: 30,
                    message: 'First name must be at most 30 characters',
                  },
                ]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="LastName"
                name="lastName"
                required
                rules={[
                  {
                    required: true,
                    message: 'Please input last name!',
                  },
                  {
                    min: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                  {
                    max: 30,
                    message: 'Last name must be at most 30 characters',
                  },
                ]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Email"
            name="email"
            required
            rules={[
              {
                required: true,
                message: 'Please input email!',
              },
              {
                type: 'email',
                message: 'Please enter a valid email',
              },
            ]}>
            <Input />
          </Form.Item>

          <Form.Item label="Application(s)" name="applications">
            <Select
              mode="multiple" // Enable multi-select
              style={{ width: '100%' }}
              placeholder="Select applications"
              showSearch={false} // Disable search functionality
            >
              {applications.map((application) => (
                <Option key={application.id} value={application.id}>
                  {application.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Role(s)" name="roles">
            <Select mode="multiple" showSearch={false}>
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.roleName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
}

export default AddUserModal;
