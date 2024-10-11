import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Input, Button, Spin, message } from 'antd';
import { updateAccount } from './myAccountUtils';
import { applicationStringBuilder, roleStringBuilder } from './utils';

const MyAccountInfo = ({ user }) => {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { roles, applications } = user;

  //build role and app string for display
  useEffect(() => {
    form.setFieldValue('rolesString', roleStringBuilder(roles));
    form.setFieldValue('applicationString', applicationStringBuilder(applications));
  }, [roles, applications]);

  useEffect(() => {}, [editing, loading]);

  const onSubmit = async () => {
    setLoading(true);
    // Validate from and set validForm to false if any field is invalid
    let validForm = true;
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    if (validForm) {
      let values = form.getFieldsValue();

      values.id = user.id;

      const response = await updateAccount(values);

      if (response.success) {
        form.setFieldsValue(response.data);
        setEditing(false);
        message.success('Account updated successfully');

        const oldUser = JSON.parse(localStorage.getItem('user'));
        const newUser = { ...oldUser, firstName: response.data.firstName, lastName: response.data.lastName };

        localStorage.setItem('user', JSON.stringify(newUser));
        window.dispatchEvent(new Event('userStorage'));
      }

      setLoading(false);
    }
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
              <Input disabled size="large" />
            </Form.Item>
          </>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Roles" name="rolesString">
                <Input disabled></Input>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Applications" name="applicationString">
                <Input disabled></Input>
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
                <Button style={{ marginRight: '1rem' }} onClick={() => setEditing(false)} disabled={loading && true}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" onClick={onSubmit} disabled={loading && true}>
                  Save {loading && <Spin style={{ marginLeft: '1rem' }} />}
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
