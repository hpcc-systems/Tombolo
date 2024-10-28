import React from 'react';
import { Modal, Form, Input, Button } from 'antd';

const RequestAccessModal = ({ form, isOpen, setIsOpen, onSubmit }) => {
  const handleSubmit = (values) => {
    onSubmit(values.comment);
    form.resetFields();
  };

  const cancelRequest = () => {
    form.resetFields();
    setIsOpen(false);
  };

  const possiblePlaceholders = [
    'LET ME IN!!!!',
    'I NEED ACCESS, LIKE YESTERDAY!!!!',
    'PLEASE SOMEBODY HELP ME!!!!',
    'I NEED TO GET IN!!!!',
    'I NEED ACCESS NOW!!!!',
  ];

  return (
    <Modal title="Request Access" open={isOpen} footer={null} onCancel={cancelRequest}>
      <Form form={form} layout="vertical" onFinish={handleSubmit} name="request">
        <Form.Item
          label="Additional Information"
          name="comment"
          rules={[
            { required: false, message: 'Please enter your comment' },
            { max: 256, message: 'Max Additonal Information Length is 256 characters' },
          ]}>
          <Input.TextArea placeholder={possiblePlaceholders[Math.floor(Math.random() * possiblePlaceholders.length)]} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
          <Button type="default" onClick={cancelRequest} style={{ marginLeft: '8px' }}>
            Close
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RequestAccessModal;
