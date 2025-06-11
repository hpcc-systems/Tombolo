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
        <Col span={8}>
          <Form.Item label="Domain" name="domain" rules={[{ required: true, message: 'Please select an option' }]}>
            <Select onChange={(value) => handleDomainChange(value)} placeholder="Domain">
              {domains.length > 0 &&
                domains.map((d, i) => {
                  return (
                    <Option key={i} value={d.value}>
                      {d.label}
                    </Option>
                  );
                })}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Product Category"
            name="productCategory"
            rules={[{ required: true, message: 'Please select an option' }]}>
            <Select placeholder="Product Category">
              {productCategories.map((c, i) => (
                <Option key={i} value={c.value}>
                  {`${c.label}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label="Severity"
            name="severity"
            rules={[{ required: true, message: 'Please select a severity level!' }]}>
            <Select placeholder="Select a severity level">
              {severityLevels.map((level, i) => (
                <Option key={i} value={level}>
                  {level}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}

export default AsrSpecificMonitoringDetails;
