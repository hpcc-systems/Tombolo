import { Col, Form, Select } from 'antd';
import React from 'react';
const { Option } = Select;

const AsrSpecificFilters = ({ integrations, domainOptions, productOptions, handleDomainChange }) => {
  const ASR_ON = integrations.some((i) => i.name === 'ASR');

  if (!ASR_ON) {
    return null;
  }

  return (
    <>
      <Col span={4}>
        <div className="notifications__filter_label">Domain</div>
        <Form.Item name="domain">
          <Select
            placeholder="Domain"
            allowClear
            disabled={false}
            onChange={(domainId) => {
              handleDomainChange(domainId);
            }}>
            {domainOptions.map((d) => (
              <Option key={d.id} value={d.id}>
                {d.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col span={4} name="product">
        <div className="notifications__filter_label">Product</div>
        <Form.Item name="product">
          <Select placeholder="Product" allowClear disabled={false}>
            {productOptions.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </>
  );
};

export default AsrSpecificFilters;
