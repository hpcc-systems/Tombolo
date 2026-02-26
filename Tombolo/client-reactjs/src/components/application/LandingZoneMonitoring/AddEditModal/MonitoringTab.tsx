import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Row, Col, Select, Input } from 'antd';
import { convertToMB } from '../Utils';
import { InfoCircleOutlined } from '@ant-design/icons';
import InfoDrawer from '../../../common/InfoDrawer';
import landingZoneMonitoringService from '@/services/landingZoneMonitoring.service';

const { Option } = Select;
const monitoringTypes = [
  { id: 1, label: 'Landing Zone Space', value: 'spaceUsage' },
  { id: 2, label: 'File(s) Not Moving', value: 'fileMovement' },
  { id: 3, label: 'File Count in a Directory', value: 'fileCount' },
];

const storageUnits = [
  { id: 0, label: 'MB', value: 'MB' },
  { id: 1, label: 'GB', value: 'GB' },
  { id: 2, label: 'TB', value: 'TB' },
  { id: 3, label: 'PB', value: 'PB' },
];

function MonitoringTab({
  form,
  clusters,
  setSelectedCluster,
  selectedCluster,
  lzMonitoringType,
  setLzMonitoringType,
  minSizeThresholdUnit,
  maxSizeThresholdUnit,
  setMinSizeThresholdUnit,
  setMaxSizeThresholdUnit,
}: any) {
  const [dropzones, setDropzones] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [selectedUserGuideName, setSelectedUserGuideName] = useState('');

  const setThresholdUnit = (value: string, field: string) => {
    if (field === 'minThreshold') setMinSizeThresholdUnit(value);
    else if (field === 'maxThreshold') setMaxSizeThresholdUnit(value);
  };

  const renderThresholdAddon = (field: string) => (
    <Select
      defaultValue={field === 'minThreshold' ? minSizeThresholdUnit : maxSizeThresholdUnit}
      style={{ width: 80 }}
      onChange={value => setThresholdUnit(value, field)}>
      {storageUnits.map(unit => (
        <Option key={unit.id} value={unit.value}>
          {unit.label}
        </Option>
      ))}
    </Select>
  );

  useEffect(() => {
    if (selectedCluster) {
      const fetchDropzones = async () => {
        try {
          const dz = await landingZoneMonitoringService.getDropZones(selectedCluster.id);
          setDropzones(dz);
        } catch (error) {
          console.error('Error fetching dropzones:', error);
        }
      };
      fetchDropzones();
    }
  }, [selectedCluster]);

  const handleDropzoneChange = (dropzoneName: string) => {
    const selectedDropzoneObj = dropzones.find(dz => dz.Name === dropzoneName);
    if (selectedDropzoneObj && selectedDropzoneObj.TpMachines && selectedDropzoneObj.TpMachines.TpMachine) {
      setMachines(selectedDropzoneObj.TpMachines.TpMachine);
    } else setMachines([]);
    form.setFieldValue('machine', undefined);
    form.setFieldValue('directory', undefined);
  };

  const handleMachineChange = (_Netaddress: string) => {
    form.setFieldValue('directory', undefined);
  };

  const handleClusterChange = (value: string) => {
    const selectedClusterDetails = clusters.find((cluster: any) => cluster.id === value);
    setSelectedCluster(selectedClusterDetails);
    setDropzones([]);
    setMachines([]);
    form.setFieldValue('dropzone', undefined);
    form.setFieldValue('machine', undefined);
    form.setFieldValue('directory', undefined);
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ maxDepth: 0 }}>
      <Card size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Cluster" name="clusterId" rules={[{ required: true, message: 'Required field' }]}>
              <Select onChange={value => handleClusterChange(value)}>
                {clusters.map((cluster: any) => (
                  <Option key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <>
                  <span>Monitoring Type</span>
                  <InfoCircleOutlined
                    style={{ marginLeft: '.5rem', color: 'var(--primary)' }}
                    onClick={() => {
                      setShowUserGuide(true);
                      setSelectedUserGuideName('lzMonitoringTypes');
                    }}
                  />
                </>
              }
              name="lzMonitoringType"
              rules={[{ required: true, message: 'Required field' }]}>
              <Select onChange={value => setLzMonitoringType(value)}>
                {monitoringTypes.map(type => (
                  <Option
                    key={type.id}
                    value={type.value}
                    disbaled={type.value === 'spaceUsage' && selectedCluster?.containerized}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Dropzone" name="dropzone" rules={[{ required: true, message: 'Required field' }]}>
              <Select onChange={handleDropzoneChange}>
                {dropzones
                  .sort((a: any, b: any) => a.Name.localeCompare(b.Name))
                  .map((dropzone: any) => (
                    <Option key={dropzone.Name} value={dropzone.Name}>{`${dropzone.Name} - ${dropzone.Path}`}</Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Machine" name="machine" rules={[{ required: true, message: 'Required field' }]}>
              <Select onChange={handleMachineChange}>
                {machines.map((machine: any) => (
                  <Option
                    key={machine.Name}
                    value={machine.Netaddress}>{`${machine.Name} - ${machine.Netaddress}`}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Directory"
          name="directory"
          rules={[
            { required: true, message: 'Required field' },
            { max: 250, message: 'Maximum of 250 characters allowed' },
          ]}>
          <Input placeholder="Enter directory path" maxLength={250} />
        </Form.Item>

        {lzMonitoringType === 'fileMovement' && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Threshold (in minutes)"
                name="threshold"
                rules={[{ required: true, message: 'Required field' }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <>
                    <span>Maximum Depth</span>
                    <InfoCircleOutlined
                      style={{ marginLeft: '.5rem', color: 'var(--primary)' }}
                      onClick={() => {
                        setShowUserGuide(true);
                        setSelectedUserGuideName('maximumDepth');
                      }}
                    />
                  </>
                }
                name="maxDepth"
                rules={[
                  { required: true, message: 'Required field' },
                  {
                    validator: (_: any, value: number) => {
                      if (value < 0 || value > 99) return Promise.reject(new Error('Value must be between 0 and 99'));
                      return Promise.resolve();
                    },
                  },
                ]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label={
                  <>
                    <span>File Name </span>
                    <InfoCircleOutlined
                      style={{ marginLeft: '.5rem', color: 'var(--primary)' }}
                      onClick={() => {
                        setShowUserGuide(true);
                        setSelectedUserGuideName('wildcard');
                      }}
                    />
                  </>
                }
                name="fileName"
                rules={[{ required: true, max: 256, message: 'Maximum of 256 characters allowed' }]}>
                <Input placeholder="Enter a pattern" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {lzMonitoringType === 'fileCount' && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Minimum File Count"
                name="minFileCount"
                rules={[
                  { required: true, message: 'Required field' },
                  {
                    validator: (_: any, value: number) => {
                      if (value < 0 || value > 999999)
                        return Promise.reject(new Error('Value must be between 0 and 999999'));
                      return Promise.resolve();
                    },
                  },
                  {
                    validator: (_: any, value: number) => {
                      if (value != null) {
                        const minFileCount = form.getFieldValue('maxFileCount');
                        if (minFileCount != null && value > minFileCount)
                          return Promise.reject(
                            new Error('Max file count must be smaller than or equal to max file count')
                          );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Maximum File Count"
                name="maxFileCount"
                rules={[
                  { required: true, message: 'Required field' },
                  {
                    validator: (_: any, value: number) => {
                      if (value < 0 || value > 999999)
                        return Promise.reject(new Error('Value must be between 0 and 999999'));
                      return Promise.resolve();
                    },
                  },
                  {
                    validator: (_: any, value: number) => {
                      if (value != null) {
                        const minFileCount = form.getFieldValue('minFileCount');
                        if (minFileCount != null && value < minFileCount)
                          return Promise.reject(
                            new Error('Max file count must be greater than or equal to min file count')
                          );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        )}

        {lzMonitoringType === 'spaceUsage' && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Minimum Threshold"
                name="minThreshold"
                rules={[
                  { required: true, message: 'Required field' },
                  {
                    validator: (_: any, value: number) => {
                      if (value < 0 || value > 999999)
                        return Promise.reject(new Error('Value must be between 0 and 999999'));
                      return Promise.resolve();
                    },
                  },
                  {
                    validator: (_: any, value: number) => {
                      if (value != null) {
                        const maxThreshold = form.getFieldValue('maxThreshold');
                        if (maxThreshold != null) {
                          const minValueInMB = convertToMB(value, minSizeThresholdUnit);
                          const maxValueInMB = convertToMB(maxThreshold, maxSizeThresholdUnit);
                          if (minValueInMB >= maxValueInMB)
                            return Promise.reject(new Error('Min threshold must be less than max threshold'));
                        }
                      }
                      return Promise.resolve();
                    },
                  },
                ]}>
                <InputNumber
                  style={{ width: '100%' }}
                  addonAfter={renderThresholdAddon('minThreshold')}
                  min={0}
                  max={999999}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Max Threshold"
                name="maxThreshold"
                rules={[
                  { required: true, message: 'Required field' },
                  {
                    validator: (_: any, value: number) => {
                      if (value < 0 || value > 999999)
                        return Promise.reject(new Error('Value must be between 0 and 999999'));
                      return Promise.resolve();
                    },
                  },
                  {
                    validator: (_: any, value: number) => {
                      if (value != null) {
                        const minThreshold = form.getFieldValue('minThreshold');
                        if (minThreshold != null) {
                          const minValueInMB = convertToMB(minThreshold, minSizeThresholdUnit);
                          const maxValueInMB = convertToMB(value, maxSizeThresholdUnit);
                          if (maxValueInMB <= minValueInMB)
                            return Promise.reject(new Error('Max threshold must be greater than min threshold'));
                        }
                      }
                      return Promise.resolve();
                    },
                  },
                ]}>
                <InputNumber
                  style={{ width: '100%' }}
                  addonAfter={renderThresholdAddon('maxThreshold')}
                  min={0}
                  max={999999}
                />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Card>

      <InfoDrawer
        open={showUserGuide}
        onClose={() => setShowUserGuide(false)}
        width="500px"
        content={selectedUserGuideName}
      />
    </Form>
  );
}

export default MonitoringTab;
