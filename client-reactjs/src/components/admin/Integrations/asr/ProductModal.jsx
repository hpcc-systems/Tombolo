// Package imports
import React from 'react';
import { Modal, Form, Input, Select } from 'antd';

const ProductModal = ({ productModalOpen, setProductModalOpen }) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    // Placeholder function for onOk
  };

  const handleCancel = () => {
    form.resetFields();
    setProductModalOpen(false);
  };

  return (
    <Modal title="Add product" open={productModalOpen} onOk={handleOk} onCancel={handleCancel} width={800}>
      <Form form={form}>
        <Form.Item name="productName" rules={[{ required: true, message: 'Please input the product name!' }]}>
          <Input placeholder="Product Name" />
        </Form.Item>
        <Form.Item name="domain" rules={[{ required: true, message: 'Please select the domain!' }]}>
          <Select placeholder="Select Domain">
            {/* Add your options here */}
            <Select.Option value="domain1">Domain 1</Select.Option>
            <Select.Option value="domain2">Domain 2</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProductModal;
