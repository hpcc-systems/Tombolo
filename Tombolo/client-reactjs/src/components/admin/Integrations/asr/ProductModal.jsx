// Package imports
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { handleError, handleSuccess } from '../../../common/handleResponse';

// Local imports
import asrService from '@/services/asr.service';

// Product tiers
const tiers = [
  { label: 'No Tier', value: 0 },
  { label: 'Tier 1', value: 1 },
  { label: 'Tier 2', value: 2 },
  { label: 'Tier 3', value: 3 },
];

const ProductModal = ({
  productModalOpen,
  setProductModalOpen,
  domains,
  selectedProduct,
  setSelectedProduct,
  setProducts,
}) => {
  const [form] = Form.useForm();

  //Effects
  useEffect(() => {
    if (selectedProduct) {
      let associatedDomains = [];
      if (selectedProduct.domains) {
        // Remove null domains
        associatedDomains = selectedProduct.domains.filter((d) => d.id !== null).map((d) => d.id);
      }
      form.setFieldsValue({
        name: selectedProduct.name,
        shortCode: selectedProduct.shortCode,
        tier: selectedProduct.tier,
        domainIds: associatedDomains,
      });
    }
  }, [selectedProduct]);

  // When Ok (Save/update) modal on from is clicked
  const handleOk = async () => {
    // Validate form
    try {
      await form.validateFields();
    } catch (error) {
      console.error('Failed to validate form', error);
    }

    // Create a new product
    try {
      const formValues = form.getFieldsValue();
      if (!selectedProduct) {
        await saveNewProduct(formValues);
      } else {
        await updateExistingProduct(formValues);
      }

      const products = await asrService.getAllProducts();
      setProducts(products);
      form.resetFields();
      setSelectedProduct(null);
      setProductModalOpen(false);
    } catch (err) {
      handleError('Failed to create product');
    }
  };

  // Create a new product
  const saveNewProduct = async (values) => {
    try {
      const payload = {
        ...values,
      };
      await asrService.createProduct({ payload });
      handleSuccess('Product created successfully');
    } catch (error) {
      throw new Error('Failed to create product');
    }
  };

  // Const update product
  const updateExistingProduct = async (values) => {
    try {
      const payload = {
        ...values,
        id: selectedProduct.id,
      };
      await asrService.updateProduct({ id: selectedProduct.id, payload });
      handleSuccess('Product updated successfully');
    } catch (error) {
      throw new Error('Failed to update product');
    }
  };

  // When cancel is clicked
  const handleCancel = () => {
    form.resetFields();
    setSelectedProduct(null);
    setProductModalOpen(false);
  };

  // JSX
  return (
    <Modal
      open={productModalOpen}
      okText={selectedProduct ? 'Update' : 'Save'}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
      maskClosable={false}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Product name"
          rules={[{ required: true, message: 'Please input the product name!' }]}>
          <Input placeholder="Product Name" />
        </Form.Item>
        <Form.Item
          label="Short code"
          name="shortCode"
          rules={[{ required: true, message: 'Please enter a short code' }]}>
          <Input placeholder="Short Code" />
        </Form.Item>
        <Form.Item label="Tier" name="tier" rules={[{ required: true, message: 'Please select a tier' }]}>
          <Select placeholder="Select Tier">
            {tiers.map((tier) => (
              <Select.Option key={tier.value} value={tier.value}>
                {tier.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Domain" name="domainIds">
          <Select placeholder="Select Domain" mode="multiple">
            {[...new Set(domains.map((domain) => domain.id))].map((domainId) => {
              const domain = domains.find((d) => d.id === domainId);
              return (
                <Select.Option key={domain.id} value={domain.id}>
                  {domain.name}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProductModal;
