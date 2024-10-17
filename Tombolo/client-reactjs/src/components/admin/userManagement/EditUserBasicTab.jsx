import React, { useEffect } from 'react';
import { Form, Input, Row, Col, Card, Select } from 'antd';

// Constants
const registrationStatusOption = ['pending', 'active', 'revoked'];
const emailVerifiedOption = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
];

const { Option } = Select;

function EditUserBasicTab({ basicUserDetailsForm, selectedUser, setUnsavedFields }) {
  // When component mounts, get pre-populated data to the form
  useEffect(() => {
    if (selectedUser) {
      basicUserDetailsForm.setFieldsValue({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        registrationMethod: selectedUser.registrationMethod,
        registrationStatus: selectedUser.registrationStatus,
        verifiedUser: selectedUser.verifiedUser,
        verifiedAt: selectedUser.verifiedAt,
        createdAt: selectedUser.createdAt,
        updatedAt: selectedUser.updatedAt,
      });
    }
  }, [selectedUser]);

  // Handle any from value changes - to keep track of unsaved fields
  const onValuesChange = (changedValues) => {
    // Compare changed value with selected user value
    if (selectedUser) {
      Object.keys(changedValues).forEach((key) => {
        if (selectedUser[key] !== changedValues[key]) {
          setUnsavedFields((prev) => ({ ...prev, userDetails: [...prev.userDetails, key] }));
        } else {
          // Remove if change is reverted
          setUnsavedFields((prev) => ({ ...prev, userDetails: prev.userDetails.filter((field) => field !== key) }));
        }
      });
    }
  };

  return (
    <Card>
      <Form form={basicUserDetailsForm} layout="vertical" onValuesChange={onValuesChange}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'Please input your first name!' }]}>
              <Input placeholder="First Name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Please input your last name!' }]}>
              <Input placeholder="Last Name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Registration Method"
              name="registrationMethod"
              rules={[{ required: true, message: 'Please input your registration method!' }]}>
              <Input placeholder="Registration Method" disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Registration Status"
              name="registrationStatus"
              rules={[{ required: true, message: 'Please input your registration status!' }]}>
              <Select placeholder="Registration Method">
                {registrationStatusOption.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="E-mail verified"
              name="verifiedUser"
              rules={[{ required: true, message: 'Please input your verified user!' }]}>
              <Select>
                {emailVerifiedOption.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Verified At"
              name="verifiedAt"
              rules={[{ required: false, message: 'Please input your verified at!' }]}>
              <Input placeholder="Verified At" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
          <Input placeholder="Email" disabled />
        </Form.Item>
      </Form>
    </Card>
  );
}

export default EditUserBasicTab;
