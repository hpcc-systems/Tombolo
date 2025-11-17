import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Card, Select, Row, Col } from 'antd';
import { useSelector } from 'react-redux';
import { DescriptionFormRules, MonitoringNameFormRules } from '../../../common/FormRules';

const { TextArea } = Input;
const { Option } = Select;

// Mock data for domains and product categories
const domains = [
  { label: 'Insurance', value: 'insurance' },
  { label: 'Legal', value: 'legal' },
  { label: 'Risk', value: 'risk' },
];

const productCategories = [
  { label: 'Auto Insurance', value: 'auto_insurance' },
  { label: 'Property Insurance', value: 'property_insurance' },
  { label: 'Life Insurance', value: 'life_insurance' },
  { label: 'Legal Research', value: 'legal_research' },
  { label: 'Risk Assessment', value: 'risk_assessment' },
];

const severityLevels = [0, 1, 2, 3];

function BasicTab({
  form,
  clusters,
  selectedCluster,
  setSelectedCluster,
  isEditing,
  selectedMonitoring,
}) {
  //Local State
  const nameRef = useRef(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [filteredProductCategories, setFilteredProductCategories] = useState(productCategories);

  //Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);

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
    
    // Filter product categories based on domain (mock logic)
    if (value === 'insurance') {
      setFilteredProductCategories(productCategories.filter(cat => cat.value.includes('insurance')));
    } else if (value === 'legal') {
      setFilteredProductCategories(productCategories.filter(cat => cat.value.includes('legal')));
    } else if (value === 'risk') {
      setFilteredProductCategories(productCategories.filter(cat => cat.value.includes('risk')));
    } else {
      setFilteredProductCategories(productCategories);
    }
  };

  const handleClusterChange = (value) => {
    const cluster = clusters.find(c => c.id === value);
    setSelectedCluster(cluster);
    console.log('Selected cluster:', cluster);
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
                {domains.map((d, i) => (
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
                {filteredProductCategories.map((c, i) => (
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
                Level {level}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default BasicTab;