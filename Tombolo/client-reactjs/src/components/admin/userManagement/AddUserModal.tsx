import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Row, Col, Card } from 'antd';
import { useSelector } from 'react-redux';

import { handleSuccess, handleError } from '@/components/common/handleResponse';
import usersService from '@/services/users.service';

const { Option } = Select;

interface Props {
  displayAddUserModal: boolean;
  setDisplayAddUserModal: (v: boolean) => void;
  roles: any[];
  setUsers: (updater: (prev: any[]) => any[]) => void;
  filters: Record<string, any>;
  setFilteredUsers: (updater: (prev: any[]) => any[]) => void;
}

const AddUserModal: React.FC<Props> = ({
  displayAddUserModal,
  setDisplayAddUserModal,
  roles,
  setUsers,
  filters,
  setFilteredUsers,
}) => {
  const [form] = Form.useForm();
  const applications = useSelector((state: any) => state.application.applications);

  useEffect(() => {
    // Reset form fields when modal is closed
  }, [displayAddUserModal]);

  const handleCancel = () => {
    setDisplayAddUserModal(false);
    form.resetFields();
  };

  const handleFormSubmission = async () => {
    try {
      const values = await form.validateFields();

      if (!values.roles) values.roles = [];
      if (!values.applications) values.applications = [];

      const newUser = await usersService.create(values);
      setUsers((prev: any[]) => [newUser, ...prev]);

      if (Object.keys(filters).length === 0) {
        setFilteredUsers((prev: any[]) => [newUser, ...prev]);
      }

      form.resetFields();
      handleSuccess('User created successfully');
      setDisplayAddUserModal(false);
    } catch (error) {
      handleError('Failed to create user');
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
                  { required: true, message: 'Please input first name!' },
                  { min: 2, message: 'First name must be at least 2 characters' },
                  { max: 30, message: 'First name must be at most 30 characters' },
                ]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                required
                rules={[
                  { required: true, message: 'Please input last name!' },
                  { min: 2, message: 'Last name must be at least 2 characters' },
                  { max: 30, message: 'Last name must be at most 30 characters' },
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
              { required: true, message: 'Please input email!' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}>
            <Input />
          </Form.Item>

          <Form.Item label="Application(s)" name="applications">
            <Select mode="multiple" style={{ width: '100%' }} placeholder="Select applications" showSearch={false}>
              {applications?.map((application: any) => (
                <Option key={application.id} value={application.id}>
                  {application.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Role(s)" name="roles">
            <Select mode="multiple" showSearch={false}>
              {roles.map((role: any) => (
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
};

export default AddUserModal;
