import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Form, Input, Button, message } from 'antd';

import { authHeader } from '../../../common/AuthHeader';

const AddEditModel = ({ visible, setModalVisibility, hooks, setHooks, isEditing, selectedHook }) => {
  const [form] = Form.useForm();

  const user = useSelector((state) => state.authenticationReducer.user);
  const title = isEditing ? 'Edit Teams Hook' : 'Add Teams Hook';

  //When save btn is clicked
  const onFinish = async () => {
    try {
      await form.validateFields();
    } catch (err) {
      return;
    }

    try {
      const hookDetails = form.getFieldsValue();
      hookDetails.createdBy = user.id;
      hookDetails.lastModifiedBy = user.id;

      const payload = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(hookDetails),
      };
      const response = await fetch('/api/teamsHook', { ...payload });

      if (!response.ok) {
        throw Error('Failed to fetch cluster metadata');
      }
      const data = await response.json();
      form.resetFields();
      setHooks((prev) => [...prev, data]);
      setModalVisibility(false);
    } catch (err) {
      message.error('Failed to add new Teams Hook');
    }
  };

  //When component is mounted
  useEffect(() => {
    if (selectedHook !== null) {
      console.log(selectedHook);
      form.setFieldsValue({ ...selectedHook });
    } else {
      form.resetFields();
    }
  }, [selectedHook]);

  //on cancel or close btn is clicked
  const onCancel = () => {
    setModalVisibility(false);
    form.resetFields();
  };

  return (
    <Modal
      visible={visible}
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
                if (!hooks.map((h) => h.name).includes(value.trim())) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('This name is already used'));
              },
            }),
            {
              pattern: /^[a-zA-Z0-9() _-]+$/,
              message: 'Valid characters for hook name includes a-z, A-Z, 0-9, (, ), -, and _',
            },
            {
              max: 100,
              message: 'Name cannot be longer than 100 characters',
            },
          ]}>
          <Input placeholder="Name" />
        </Form.Item>
        <Form.Item
          name="url"
          label="URL"
          rules={[
            { required: true, message: 'Please enter a URL' },
            {
              max: 350,
              message: 'The hook URL cannot be longer than 350 characters',
            },
          ]}>
          <Input placeholder="URL" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddEditModel;
