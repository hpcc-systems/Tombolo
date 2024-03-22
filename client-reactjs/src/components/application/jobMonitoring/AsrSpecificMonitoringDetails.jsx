// Desc: This file contains the form for ASR specific monitoring details
import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Input, Select, message } from 'antd';

import { getDomains, getProductCategories, getMonitoringTypeId } from './jobMonitoringUtils';

//Constants
const { Option } = Select;
const monitoringTypeName = 'Job Monitoring';

const severityLevels = [0, 1, 2, 3];

function AsrSpecificMonitoringDetails({ form }) {
  //Local States
  const [monitoringTypeId, setMonitoringTypeId] = useState(null);
  const [domains, setDomains] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);

  //Effects
  useEffect(() => {
    // monitoring type id

    (async () => {
      try {
        const monitoringTypeId = await getMonitoringTypeId({ monitoringTypeName });
        setMonitoringTypeId(monitoringTypeId);
      } catch (error) {
        message.error('Error fetching monitoring type ID');
      }
    })();
  }, []);

  useEffect(() => {
    // Get domains
    if (!monitoringTypeId) return;
    (async () => {
      try {
        const domainData = await getDomains({ monitoringTypeId });
        setDomains(domainData);
      } catch (error) {
        message.error('Error fetching domains');
      }
    })();

    // Get product categories
    if (!selectedDomain) return;

    (async () => {
      try {
        const productCategories = await getProductCategories({ domainId: selectedDomain });
        setProductCategories(productCategories);
      } catch (error) {
        message.error('Error fetching product category');
      }
    })();
  }, [monitoringTypeId, selectedDomain]);

  //Handle domain change function
  const handleDomainChange = (value) => {
    form.setFieldsValue({ productCategory: undefined });
    setSelectedDomain(value);
  };

  return (
    <Form layout="vertical" form={form}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Domain" name="domain" rules={[{ required: true, message: 'Please select an option' }]}>
            <Select onChange={(value) => handleDomainChange(value)} placeholder="Domain">
              {domains.length > 0 &&
                domains.map((d) => {
                  return (
                    <Option key={d.id} value={d.id}>
                      {d.name}
                    </Option>
                  );
                })}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Product Category"
            name="productCategory"
            rules={[{ required: true, message: 'Please select an option' }]}>
            <Select placeholder="Product Category">
              {productCategories.map((c) => (
                <Option key={c.id} value={c.id}>
                  {`${c.name} (${c.shortCode})`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Severity"
            name="severity"
            rules={[{ required: true, message: 'Please select a severity level!' }]}>
            <Select placeholder="Select a severity level">
              {severityLevels.map((level) => (
                <Option key={level} value={level}>
                  {level}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Require Complete"
            name="requireComplete"
            rules={[{ required: true, message: 'Please select one option' }]}>
            <Select placeholder="Require complete">
              <Option key="yes" value={true}>
                Yes
              </Option>
              <Option key="no" value={false}>
                No
              </Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Maximum Build Time / Threshold (in mins)"
            name="threshold"
            required={form.getFieldValue('notificationCondition')?.includes('ThresholdExceeded')}
            rules={[
              {
                validator: async (_, value) => {
                  if (form.getFieldValue('notificationCondition')?.includes('ThresholdExceeded')) {
                    if (!value) {
                      return Promise.reject(new Error('This field is required'));
                    } else if (!(parseInt(value) > 0 && parseInt(value) < 1440)) {
                      return Promise.reject(new Error('Threshold should be between 0 and 1440'));
                    }
                  }
                },
              },
            ]}>
            <Input type="number" min={1} max={1440} style={{ width: '100%' }} placeholder="Threshold (in minutes)" />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}

export default AsrSpecificMonitoringDetails;
