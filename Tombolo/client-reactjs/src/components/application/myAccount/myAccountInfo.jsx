import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Input, Button } from 'antd';

const MyAccountInfo = ({ user }) => {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

  const { roles, applications } = user;

  useEffect(() => {}, [editing]);

  const onSubmit = () => {
    alert('save user code fires here');
  };

  return (
    <div style={{ width: '100%' }}>
      <Card style={{ width: '50%', margin: '0 auto', textAlign: 'left' }}>
        <Form form={form} layout="vertical" initialValues={user}>
          <>
            {/* first name, last name, password, confirm password fields */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ max: 64, message: 'Maximum of 64 characters allowed' }]}>
                  <Input disabled={!editing} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ max: 64, message: 'Maximum of 64 characters allowed' }]}>
                  <Input disabled={!editing} size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  whitespace: true,
                  type: 'email',
                  message: 'Invalid e-mail address.',
                },
                { max: 64, message: 'Maximum of 64 characters allowed' },
              ]}>
              <Input disabled={!editing} size="large" />
            </Form.Item>
          </>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Roles" name="roles">
                <Input disabled value={roles.join(', ')}></Input>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Applications" name="applications">
                <Input disabled value={applications.join(', ')}></Input>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
            {!editing ? (
              <Button type="primary" htmlType="submit" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : (
              <>
                <Button style={{ marginRight: '1rem' }} onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" onClick={onSubmit}>
                  Save
                </Button>
              </>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default MyAccountInfo;
