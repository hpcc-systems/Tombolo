// Desc: This file contains the form for ASR specific monitoring details
import React from 'react';
const { Form, Row, Col, Select } = require('antd');

//Constants
const { Option } = Select;

const severityLevels = [0, 1, 2, 3];

function AsrSpecificMonitoringDetails({ form, domains, productCategories, setSelectedDomain }) {
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
                    <Option key={d.id} value={d.value}>
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
                <Option key={c.id} value={c.value}>
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
    </Form>
  );
}

export default AsrSpecificMonitoringDetails;
