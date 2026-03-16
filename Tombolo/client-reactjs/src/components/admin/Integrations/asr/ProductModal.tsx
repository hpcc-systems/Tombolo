import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { handleError, handleSuccess } from '../../../common/handleResponse';
import asrService from '@/services/asr.service';

const { Option } = Select;

const tiers = [
  { label: 'No Tier', value: 0 },
  { label: 'Tier 1', value: 1 },
  { label: 'Tier 2', value: 2 },
  { label: 'Tier 3', value: 3 },
];

interface Props {
  productModalOpen?: boolean;
  setProductModalOpen?: (open: boolean) => void;
  domains?: any[];
  selectedProduct?: any;
  setSelectedProduct?: (p: any) => void;
  setProducts?: (ps: any[]) => void;
}

const ProductModal: React.FC<Props> = ({
  productModalOpen,
  setProductModalOpen,
  domains = [],
  selectedProduct,
  setSelectedProduct,
  setProducts,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedProduct) {
      let associatedDomains: any[] = [];
      if (selectedProduct.domains) {
        associatedDomains = selectedProduct.domains.filter((d: any) => d.id !== null).map((d: any) => d.id);
      }
      form.setFieldsValue({
        name: selectedProduct.name,
        shortCode: selectedProduct.shortCode,
        tier: selectedProduct.tier,
        domainIds: associatedDomains,
      });
    }
  }, [selectedProduct]);

  const handleOk = async () => {
    try {
      await form.validateFields();
    } catch (error) {
      console.error('Failed to validate form', error);
      return;
    }

    try {
      const formValues = form.getFieldsValue();
      if (!selectedProduct) {
        await saveNewProduct(formValues);
      } else {
        await updateExistingProduct(formValues);
      }

      const products = await asrService.getAllProducts();
      setProducts && setProducts(products);
      form.resetFields();
      setSelectedProduct && setSelectedProduct(null);
      setProductModalOpen && setProductModalOpen(false);
    } catch (_err) {
      handleError('Failed to create product');
    }
  };

  const saveNewProduct = async (values: any) => {
    try {
      const payload = { ...values };
      await asrService.createProduct({ payload });
      handleSuccess('Product created successfully');
    } catch (_error) {
      throw new Error('Failed to create product');
    }
  };

  const updateExistingProduct = async (values: any) => {
    try {
      const payload = { ...values, id: selectedProduct.id };
      await asrService.updateProduct({ id: selectedProduct.id, payload });
      handleSuccess('Product updated successfully');
    } catch (_error) {
      throw new Error('Failed to update product');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedProduct && setSelectedProduct(null);
    setProductModalOpen && setProductModalOpen(false);
  };

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
          rules={[{ required: true, message: 'Please input the product name!' }, { max: 100 }]}>
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
            {tiers.map(tier => (
              <Option key={tier.value} value={tier.value}>
                {tier.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Domain" name="domainIds">
          <Select placeholder="Select Domain" mode="multiple">
            {[...new Set(domains.map((domain: any) => domain.id).filter((id: any) => id != null))].map(
              (domainId: any) => {
                const domain = domains.find((d: any) => d.id === domainId);
                if (!domain) return null;
                return (
                  <Option key={domain.id} value={domain.id}>
                    {domain.name}
                  </Option>
                );
              }
            )}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProductModal;
