import React from 'react';
import { Form, Row, Col, Select } from 'antd';

const { Option } = Select;

const severityLevels = [0, 1, 2, 3];

const AsrSpecificMonitoringDetails: React.FC<any> = ({
  form,
  domains = [],
  productCategories = [],
  setSelectedDomain,
}) => {
  const handleDomainChange = (value: any) => {
    form.setFieldsValue({ productCategory: undefined });
    setSelectedDomain?.(value);
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="Domain" name="domain">
            <Select onChange={value => handleDomainChange(value)} placeholder="Domain">
              {domains.length > 0 &&
                domains.map((d: any, i: number) => (
                  <Option key={i} value={d.value}>
                    {d.label}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Product Category" name="productCategory">
            <Select placeholder="Product Category">
              {productCategories.map((c: any, i: number) => (
                <Option key={i} value={c.value}>
                  {`${c.label}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="Severity" name="severity">
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
    </>
  );
};

export default AsrSpecificMonitoringDetails;
