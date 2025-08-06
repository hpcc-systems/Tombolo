/* eslint-disable*/

import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Row, Col } from 'antd';
import AsrSpecificMonitoringDetails from '../../../common/Monitoring/AsrSpecificMonitoringDetails';
import { useSelector } from 'react-redux';

// Constants
const { Option } = Select;
const monitoringTypes = [
  { label: 'Cluster Status', value: 'status' },
  { label: 'Cluster Usage', value: 'usage' },
];

function BasicTab({ form, domains, productCategories, setSelectedDomain }) {
  // States
  const [monitoringType, setMonitoringType] = useState(null);

  // Redux
  const {
    applicationReducer: {
      application: { applicationId },
      integrations,
      clusters,
    },
  } = useSelector((state) => state);

  // Check if ASR integration is enabled
  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        label="Monitoring Name"
        name="monitoringName"
        rules={[{ required: true, message: 'Please enter a monitoring name' }]}>
        <Input placeholder="Enter monitoring name" />
      </Form.Item>
      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: 'Please enter a description' }]}>
        <Input.TextArea placeholder="Enter description" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={monitoringType === 'usage' ? 12 : 24}>
          <Form.Item
            label="Monitoring Type"
            name="clusterMonitoringType"
            rules={[{ required: true, message: 'Please select a monitoring type' }]}>
            <Select
              placeholder="Select monitoring type"
              mode="multiple"
              onChange={(value) => {
                setMonitoringType(value);
              }}>
              {monitoringTypes.map((type) => {
                return (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>
        {monitoringType === 'usage' && (
          <Col span={12}>
            <Form.Item
              label="Threshold %"
              name="threshold"
              rules={[{ required: true, message: 'Please enter a threshold percentage' }]}>
              <InputNumber placeholder="Enter threshold percentage" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        )}
      </Row>

      <Form.Item label="Cluster" name="clusterId" rules={[{ required: true, message: 'Select a cluster' }]}>
        <Select placeholder="Select a cluster">
          {clusters.map((cluster) => {
            return (
              <Option key={cluster.id} value={cluster.id}>
                {cluster.name}
              </Option>
            );
          })}
        </Select>
      </Form.Item>

      {asrIntegration && (
        <AsrSpecificMonitoringDetails
          form={form}
          domains={domains}
          productCategories={productCategories}
          setSelectedDomain={setSelectedDomain}
        />
      )}
    </Form>
  );
}

export default BasicTab;
