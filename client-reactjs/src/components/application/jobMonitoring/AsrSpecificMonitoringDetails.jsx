// Desc: This file contains the form for ASR specific monitoring details
import React, { useEffect, useState } from 'react';
const { Form, Row, Col, Input, Select } = require('antd');

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
  const [categories, setCategories] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);

  //Effects
  useEffect(() => {
    getDomains();
    getProductCategory();
  }, []);

  //Function to get domain
  const getDomains = async () => {
    //TODO: Fetch domain  from Fido server -  this is just a place holder function
    setDomain([
      {
        label: 'Domain - 1',
        value: 'domain1',
      },
      {
        label: 'Domain - 2',
        value: 'domain2',
      },
    ]);
  };

  // Function to get product category
  const getProductCategory = async (_domain) => {
    //TODO: Fetch product Category  from Fido server -  this is just a place holder function
    setCategories({
      domain1: [
        { label: 'Category-1a', value: 'category1' },
        { label: 'Category-2a', value: 'category2' },
      ],
      domain2: [
        { label: 'Category-1b', value: 'category1' },
        { label: 'Category-2b', value: 'category2' },
      ],
    });
  };
  return (
    <Form layout="vertical" form={form}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Domain" name="domain" rules={[{ required: true, message: 'Please select an option' }]}>
            <Select onChange={(value) => setSelectedDomain(value)} placeholder="Domain">
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
              {selectedDomain && categories[selectedDomain].map((c) => <Option key={c.value}>{c.label}</Option>)}
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
