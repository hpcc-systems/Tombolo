import { Form, Button, Input, message } from 'antd';
import React, { useState } from 'react';

const SubProcessDetails = ({ onClose, selectedAsset, viewMode }) => {
  const [form] = Form.useForm();

  const [editable, setEditable] = useState(false);

  const submitForm = async (values) => {
    message.success('saved');
    onClose({ ...values });
  };

  const editSubProcess = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setEditable(true);
  };

  const subProcess = {
    title: selectedAsset.title,
    description: selectedAsset.description || '',
  };

  return (
    <Form
      form={form}
      autoComplete="off"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 8 }}
      name="Schedule Sub-Process"
      // style={{ minHeight: '400px' }}
      onFinish={submitForm}
      initialValues={{ ...subProcess }}>
      <Form.Item
        rules={[{ required: editable, message: 'Please provide Sub-Process title' }]}
        name="title"
        label="Sub-Process">
        {!editable ? <span>{subProcess.title} </span> : <Input />}
      </Form.Item>
      <Form.Item name="description" label="Description">
        {!editable ? <span>{subProcess.description} </span> : <Input.TextArea style={{ height: 120 }} />}
      </Form.Item>
      <Form.Item hidden={viewMode} wrapperCol={{ offset: 8, span: 8 }}>
        {!editable ? (
          <Button type="primary" onClick={editSubProcess}>
            Edit
          </Button>
        ) : (
          <Button type="primary" block htmlType="submit">
            Save
          </Button>
        )}
      </Form.Item>
    </Form>
  );
};

export default SubProcessDetails;
