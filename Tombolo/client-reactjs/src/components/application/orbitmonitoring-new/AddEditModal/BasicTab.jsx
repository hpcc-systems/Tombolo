import React, { useEffect, useRef } from 'react';
import { Form, Input, Card, Select, Row, Col } from 'antd';
import { DescriptionFormRules, MonitoringNameFormRules } from '../../../common/FormRules';

const { TextArea } = Input;
const { Option } = Select;

const severityLevels = [0, 1, 2, 3];

function BasicTab({
  form,
  domains,
  productCategories,
  setSelectedDomain,
  isEditing,
}) {
  //Local State
  const nameRef = useRef(null);

  // Focus on monitoring name input when adding new
  useEffect(() => {
    if (form && !isEditing && nameRef.current) {
      nameRef.current.focus();
    }
  }, [form, isEditing]);

  //Handle domain change function
  const handleDomainChange = (value) => {
    form.setFieldsValue({ productCategory: undefined });
    setSelectedDomain(value);
  };



  return (
    <Card size="small" style={{ marginBottom: '1rem' }}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Monitoring Name"
          name="monitoringName"
          rules={[
            ...MonitoringNameFormRules,
            () => ({
              validator(_, value) {
                if (isEditing) return Promise.resolve();
                // Add uniqueness validation logic here if needed
                return Promise.resolve();
              },
            }),
          ]}>
          <Input
            placeholder="Enter a name"
            ref={nameRef}
          />
        </Form.Item>

        <Form.Item label="Description" name="description" rules={DescriptionFormRules}>
          <TextArea
            placeholder="Enter a short description"
            rows={2}
            maxLength={150}
            showCount
            autoSize={{
              minRows: 2,
              maxRows: 4,
            }}
          />
        </Form.Item>

        {/* ASR Specific Fields - Always visible and mandatory for Orbit Monitoring New */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              label="Domain" 
              name="domain"
              rules={[{ required: true, message: 'Please select a domain' }]}>
              <Select onChange={handleDomainChange} placeholder="Select domain">
                {domains?.map((d, i) => (
                  <Option key={i} value={d.value}>
                    {d.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              label="Product Category" 
              name="productCategory"
              rules={[{ required: true, message: 'Please select a product category' }]}>
              <Select placeholder="Select product category">
                {productCategories?.map((c, i) => (
                  <Option key={i} value={c.value}>
                    {c.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item 
          label="Severity" 
          name="severity"
          rules={[{ required: true, message: 'Please select a severity level' }]}>
          <Select placeholder="Select a severity level">
            {severityLevels.map((level, i) => (
              <Option key={i} value={level}>
                 {level}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default BasicTab;