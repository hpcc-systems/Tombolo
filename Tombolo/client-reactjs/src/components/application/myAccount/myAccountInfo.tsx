import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Spin } from 'antd';

import { roleStringBuilder } from './utils';
import { setUser, getUser } from '../../common/userStorage';
import styles from './myAccount.module.css';
import { handleSuccess } from '../../common/handleResponse';
import usersService from '@/services/users.service';

interface Props {
  user: any;
  editing: boolean;
  setEditing: (b: boolean) => void;
}

const MyAccountInfo: React.FC<Props> = ({ user, editing, setEditing }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { roles } = user;

  useEffect(() => {
    form.setFieldValue('rolesString', roleStringBuilder(roles));
  }, [roles]);

  const onSubmit = async () => {
    setLoading(true);
    let validForm = true;
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    try {
      if (validForm) {
        let values = form.getFieldsValue();
        values.id = user.id;
        values.verifiedUser = user.verifiedUser;

        const data = await usersService.update({ userId: user.id, userData: values });

        if (data) {
          form.setFieldsValue(data);
          setEditing(false);
          handleSuccess('Account updated successfully');

          const oldUser = getUser();
          const newUser = { ...oldUser, firstName: data.firstName, lastName: data.lastName };

          setUser(JSON.stringify(newUser));
          window.dispatchEvent(new Event('userStorage'));
        }

        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical" initialValues={user}>
        <>
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
              { whitespace: true, type: 'email', message: 'Invalid e-mail address.' },
              { max: 64, message: 'Maximum of 64 characters allowed' },
            ]}>
            <Input disabled size="large" />
          </Form.Item>
        </>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Roles" name="rolesString">
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        <div className={styles.editInfo}>
          {editing && (
            <>
              <Button style={{ marginRight: '1rem' }} onClick={() => setEditing(false)} disabled={!!loading}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" onClick={onSubmit} disabled={!!loading}>
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
