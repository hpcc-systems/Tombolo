// Imports from libraries
import React, { useEffect, useRef, useState } from 'react';
import { Form, Select, Input, Card, Row, Col } from 'antd';
import { useSelector } from 'react-redux';
import type { FormInstance } from 'antd';

// Local imports
import AsrSpecificMonitoringDetails from '../../common/Monitoring/AsrSpecificMonitoringDetails';
import { DescriptionFormRules, MonitoringNameFormRules } from '../../common/FormRules';
import type { FileMonitoringDTO } from '@tombolo/shared';

interface Cluster {
  id: string;
  name: string;
  timezone_offset?: number | null;
  [key: string]: any;
}

interface Domain {
  value: string;
  label: string;
}

interface ProductCategory {
  id: string;
  name: string;
  shortCode: string;
}

interface FileMonitoringBasicTabProps {
  form: FormInstance;
  clusters: Cluster[];
  handleClusterChange: (clusterId: string) => void;
  selectedClusters: Cluster[];
  isDuplicating: boolean;
  isEditing: boolean;
  fileMonitoring: FileMonitoringDTO[];
  domains: Domain[];
  productCategories: ProductCategory[];
  setSelectedDomain: (domain: string) => void;
  setMonitoringFileType: (type: string) => void;
  fileTypes: Record<string, string>;
}

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
  fileTypes,
}: FileMonitoringBasicTabProps) {
  const [clusterOffset, setClusterOffset] = useState<string | null>(null);
  const monitoringNameInputRef = useRef<any>(null);

  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const integrations = useSelector((state: any) => state.application.integrations);

  const asrIntegration = integrations.some(
    (integration: any) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  useEffect(() => {
    if (selectedClusters?.[0]?.timezone_offset === null || selectedClusters?.[0]?.timezone_offset === undefined) return;
    const offSet = selectedClusters[0].timezone_offset! / 60;
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
      const doesNameExist = (newName: string) => {
        return fileMonitoring.some(monitoring => monitoring.monitoringName === newName);
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
            <Select placeholder="Select a  cluster" onChange={value => handleClusterChange(value)}>
              {clusters.map(cluster => {
                return (
                  <Select.Option key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </Select.Option>
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
              onChange={value => {
                setMonitoringFileType(value);
              }}>
              {Object.keys(fileTypes).map(k => (
                <Select.Option key={k} value={k}>
                  {fileTypes[k]}
                </Select.Option>
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
    </Card>
  );
}

export default FileMonitoringBasicTab;
