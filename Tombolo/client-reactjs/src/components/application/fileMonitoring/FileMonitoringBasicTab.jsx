import React, { useEffect, useRef, useState } from 'react';
import { Form, Select, Input, Card, Row, Col, Space } from 'antd';
import AsrSpecificMonitoringDetails from '../../common/Monitoring/AsrSpecificMonitoringDetails';
import { useSelector } from 'react-redux';
import { DescriptionFormRules, MonitoringNameFormRules } from '../../common/FormRules';

const { Option } = Select;

const fileTypes = [
  {
    label: 'Standard Logical File',
    value: 'stdLogicalFile',
  },
  {
    label: 'Super File',
    value: 'superFile',
  },
];

function FileMonitoringBasicTab({
  form,
  clusters,
  handleClusterChange,
  selectedClusters,
  isDuplicating,
  isEditing,
  fileMonitoring,
  domains,
  productCategories,
  setSelectedDomain,
  setMonitoringFileType,
}) {
  const [clusterOffset, setClusterOffset] = useState(null);
  const monitoringNameInputRef = useRef(null);

  const applicationId = useSelector((state) => state.application.application.applicationId);
  const integrations = useSelector((state) => state.application.integrations);

  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  useEffect(() => {
    if (selectedClusters?.[0]?.timezone_offset === null || selectedClusters?.[0]?.timezone_offset === undefined) return;
    const offSet = selectedClusters[0].timezone_offset / 60;
    if (offSet === 0) {
      setClusterOffset('UTC');
    } else {
      setClusterOffset(`UTC ${offSet}`);
    }
  }, [selectedClusters]);

  useEffect(() => {
    if (form && !isEditing) {
      monitoringNameInputRef.current?.input.focus();
    }
  }, [form, isEditing]);

  useEffect(() => {
    if (isDuplicating) {
      // This function is a temporary fix and only works on the application level
      const doesNameExist = (newName) => {
        return fileMonitoring.some((monitoring) => monitoring.monitoringName === newName);
      };

      let currentMonitoringName = form.getFieldValue('monitoringName');
      let newName = `copy-${currentMonitoringName}`;
      let copyCount = 1;

      // Keep incrementing until a unique name is found
      while (doesNameExist(newName)) {
        copyCount++;
        newName = `copy-${currentMonitoringName}-${copyCount}`;
      }

      form.setFields([
        {
          name: 'monitoringName',
          value: newName,
          warnings: ['Auto generated name. Please modify if necessary.'],
        },
      ]);
    }
  }, [isDuplicating, form, fileMonitoring, isEditing]);

  return (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item label="Monitoring Name" name="monitoringName" rules={MonitoringNameFormRules}>
          <Input placeholder="Enter monitoring name" ref={monitoringNameInputRef} />
        </Form.Item>
        <Form.Item label="Description" name="description" rules={DescriptionFormRules}>
          <Input.TextArea placeholder="Enter description" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Cluster"
              name="clusterId"
              rules={[{ required: true, message: 'Select at least one cluster' }]}>
              <Select placeholder="Select a  cluster" onChange={(value) => handleClusterChange(value)}>
                {clusters.map((cluster) => {
                  return (
                    <Option key={cluster.id} value={cluster.id}>
                      {cluster.name}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="File Type"
              name="fileMonitoringType"
              rules={[{ required: true, message: 'Select a file type' }]}>
              <Select
                placeholder="Select a file type"
                onChange={(value) => {
                  setMonitoringFileType(value);
                }}>
                {fileTypes.map((fileType) => (
                  <Option key={fileType.value} value={fileType.value}>
                    {fileType.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* File name or pattern */}
        <Form.Item
          label="File Name or Pattern"
          name="fileNamePattern"
          rules={[{ required: true, message: 'Enter a file name or pattern' }]}>
          <Input placeholder="Enter file name or pattern" />
        </Form.Item>

        {asrIntegration && (
          <AsrSpecificMonitoringDetails
            form={form}
            clusterOffset={clusterOffset}
            domains={domains}
            productCategories={productCategories}
            setSelectedDomain={setSelectedDomain}
          />
        )}
      </Form>
    </Card>
  );
}

export default FileMonitoringBasicTab;
