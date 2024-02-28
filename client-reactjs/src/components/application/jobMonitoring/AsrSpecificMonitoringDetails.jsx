// Desc: This file contains the form for ASR specific monitoring details
import React, { useEffect, useState } from 'react';
const { Form, Row, Col, Input, Select, message } = require('antd');

import { getDomains, getProductCategories } from '../../../api/fido';

//Constants
const { Option } = Select;
const jobRunType = [
  { label: 'Daytime', value: 'Daytime' },
  { label: 'Overnight', value: 'Overnight' },
  { label: 'AM', value: 'AM' },
  { label: 'PM', value: 'PM' },
  { label: 'Every 2 Days', value: 'Every2days' },
];
const severityLevels = [0, 1, 2, 3];

function AsrSpecificMonitoringDetails({ form }) {
  //Local States
  const [domain, setDomain] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);

  //Effects
  useEffect(() => {
    const activityTypeId = '0008'; // JOB/APP monitoring activity type per the ASR database
    // Get domains
    (async () => {
      try {
        const domainData = await getDomains({ activityTypeId });
        setDomain(domainData);
      } catch (error) {
        message.error('Error fetching domains');
      }
    })();

    // Get product categories
    if (selectedDomain) {
      (async () => {
        try {
          const productCategories = await getProductCategories({ domainId: selectedDomain, activityTypeId });
          setProductCategories(productCategories);
        } catch (error) {
          message.error('Error fetching product category');
        }
      })();
    }
  }, [selectedDomain]);

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
              {domain.length > 0 &&
                domain.map((d) => {
                  return (
                    <Option key={d.value} value={d.value}>
                      {d.label}
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
                <Option key={c.value} value={c.value}>
                  {c.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Job Monitor Type"
            name="jobMonitorType"
            rules={[
              {
                required: true,
                message: 'Please enter a 6-digit number in HHMMSS format!',
              },
            ]}>
            <Select placeholder="Job monitor type">
              {jobRunType.map((t) => (
                <Option key={t.value} value={t.value}>
                  {t.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

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
      </Row>

      <Row gutter={16}>
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
