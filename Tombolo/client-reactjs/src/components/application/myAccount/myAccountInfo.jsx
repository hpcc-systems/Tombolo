import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Spin, message } from 'antd';
import { roleStringBuilder, updateAccount } from './utils';
import { setUser, getUser } from '../../common/userStorage';
import styles from './myAccount.module.css';

const MyAccountInfo = ({ user, editing, setEditing }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { roles } = user;

  //build role and app string for display
  useEffect(() => {
    form.setFieldValue('rolesString', roleStringBuilder(roles));
  }, [roles]);

  const onSubmit = async () => {
    setLoading(true);
    // Validate from and set validForm to false if any field is invalid
    let validForm = true;
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    try {
      if (validForm) {
        let values = form.getFieldsValue();

        //put items in needed for backend verification
        values.id = user.id;
        values.verifiedUser = user.verifiedUser;

        const response = await updateAccount(values);

        if (response.success) {
          form.setFieldsValue(response.data);
          setEditing(false);
          message.success('Account updated successfully');

          const oldUser = getUser();
          const newUser = { ...oldUser, firstName: response.data.firstName, lastName: response.data.lastName };

          setUser(JSON.stringify(newUser));
          window.dispatchEvent(new Event('userStorage'));
        }

        setLoading(false);
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <div>
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
          <Col span={24}>
            <Form.Item label="Roles" name="rolesString">
              <Input disabled></Input>
            </Form.Item>
          </Col>
        </Row>

        <div className={styles.editInfo}>
          {editing && (
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
    </div>
  );
};

export default MyAccountInfo;
