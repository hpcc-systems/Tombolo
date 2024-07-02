import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Form, Input, Button, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

import { authHeader } from '../../../common/AuthHeader';

const AddEditModal = ({ visible, setModalVisibility, groups, setGroups, isEditing, setIsEditing, selectedGroup }) => {
  const [form] = Form.useForm();

  const user = useSelector((state) => state.authenticationReducer.user);
  const title = isEditing ? 'Edit Email' : 'Add Email ';

  //when editing, set form fields
  useEffect(() => {
    if (selectedGroup && isEditing) {
      form.setFieldsValue({ ...selectedGroup, emails: selectedGroup.emails.emails });
    }
  }, [selectedGroup, isEditing]);

  //When save btn is clicked
  const onFinish = async () => {
    try {
      await form.validateFields();
    } catch (err) {
      return;
    }

    try {
      const groupDetails = form.getFieldsValue();
      const emails = form.getFieldsValue().emails.map((email) => email);
      groupDetails.emails = { emails };
      groupDetails.createdBy = user.id;
      groupDetails.lastModifiedBy = user.id;
      groupDetails.approved = true;
      groupDetails.approvedBy = user.id;

      const payload = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(groupDetails),
      };
      const response = await fetch('/api/emailGroup', { ...payload });

      if (!response.ok) {
        throw Error('Failed to fetch cluster metadata');
      }
      const data = await response.json();
      form.resetFields();
      setGroups((prev) => [...prev, data]);
      setModalVisibility(false);
    } catch (err) {
      console.log(err);
      message.error('Failed to add new Email Group');
    }
  };

  //on cancel or close btn is clicked
  const onCancel = () => {
    setModalVisibility(false);
    setIsEditing(false);
    form.resetFields();
  };

  return (
    <Modal
      open={visible}
      maskClosable={false}
      title={title}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={onFinish}>
          {isEditing ? 'Save' : 'Add'}
        </Button>,
      ]}>
      <Form layout="vertical" form={form}>
        <Form.Item
          name="name"
          label="Name"
          rules={[
            { required: true, message: 'Please enter a name' },
            () => ({
              validator(_, value) {
                if (!groups.map((h) => h.name).includes(value.trim())) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('This name is already used'));
              },
            }),
            {
              pattern: /^[a-zA-Z0-9() _-]+$/,
              message: 'Valid characters for group name includes a-z, A-Z, 0-9, (, ), -, and _',
            },
            {
              max: 100,
              message: 'Name cannot be longer than 100 characters',
            },
          ]}>
          <Input placeholder="Name" />
        </Form.Item>
        <Form.List name="emails">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, _index) => (
                <Form.Item required={true} key={field.key}>
                  <div style={{ display: 'flex', placeItems: 'center' }}>
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      type="email"
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          type: 'email',
                          message: 'Invalid e-mail address.',
                        },
                        {
                          max: 256,
                          message: 'E-mail address too log',
                        },
                      ]}
                      noStyle>
                      <Input placeholder="E-mail" />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <MinusCircleOutlined
                        className="dynamic-delete-button"
                        onClick={() => remove(field.name)}
                        style={{ marginLeft: '10px' }}
                      />
                    ) : null}
                  </div>
                </Form.Item>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  width={'100%'}
                  style={{ width: '100% -10px' }}>
                  Add E-mail
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default AddEditModal;
