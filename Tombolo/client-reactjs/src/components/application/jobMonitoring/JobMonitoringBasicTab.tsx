import React, { useEffect, useRef, useState } from 'react';
import { Form, Select, AutoComplete, Input, Card, Row, Col } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import { useSelector } from 'react-redux';
import type { FormInstance } from 'antd';

import InfoDrawer from '../../common/InfoDrawer';
import { doesNameExist } from './jobMonitoringUtils';
import AsrSpecificMonitoringDetails from '../../common/Monitoring/AsrSpecificMonitoringDetails';
import { DescriptionFormRules, MonitoringNameFormRules } from '../../common/FormRules';
import hpccService from '@/services/hpcc.service';
import { JobMonitoringDTO } from '@tombolo/shared';

const { Option } = Select;
const { TextArea } = Input;

type Cluster = any;
type Domain = { value: string; label: string };
type ProductCategory = any;

const monitoringScopeOptions = [
  { label: 'Specific job', value: 'SpecificJob' },
  { label: 'Monitoring by Job Pattern', value: 'PatternMatching' },
];

interface Props {
  form: FormInstance<any>;
  clusters: Cluster[];
  monitoringScope: string;
  setMonitoringScope: (v: string) => void;
  jobMonitorings: JobMonitoringDTO[];
  isEditing?: boolean;
  isDuplicating?: boolean;
  selectedCluster?: Cluster | null;
  setSelectedCluster: (c: Cluster) => void;
  domains: Domain[];
  productCategories: ProductCategory[];
  setSelectedDomain: (d: string) => void;
}

const JobMonitoringBasicTab: React.FC<Props> = ({
  form,
  clusters,
  monitoringScope,
  setMonitoringScope,
  jobMonitorings,
  isEditing,
  isDuplicating,
  selectedCluster,
  setSelectedCluster,
  domains,
  productCategories,
  setSelectedDomain,
}) => {
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [selectedUserGuideName, setSelectedUserGuideName] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [clusterOffset, setClusterOffset] = useState<string | null>(null);

  const monitoringNameInputRef = useRef<HTMLInputElement | null>(null);

  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const integrations = useSelector((state: any) => state.application.integrations);

  const asrIntegration = integrations.some(
    (integration: any) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  useEffect(() => {
    if (selectedCluster?.timezone_offset === null || selectedCluster?.timezone_offset === undefined) return;
    const offSet = selectedCluster.timezone_offset / 60;
    if (offSet === 0) {
      setClusterOffset('UTC');
    } else {
      setClusterOffset(`UTC ${offSet}`);
    }
  }, [selectedCluster]);

  useEffect(() => {
    if (form && !isEditing && monitoringNameInputRef.current) {
      monitoringNameInputRef.current.focus();
    }

    if (isDuplicating) {
      let currentMonitoringName: string = form.getFieldValue('monitoringName') || '';
      let copyCount = 1;

      const match = currentMonitoringName.match(/^(.*) \(Copy (\d+)\)$/);
      if (match) {
        currentMonitoringName = match[1];
        copyCount = parseInt(match[2], 10) + 1;
      }

      let newName = `${currentMonitoringName} (Copy ${copyCount})`;

      while (doesNameExist({ jobMonitorings, newName })) {
        copyCount++;
        newName = `${currentMonitoringName} (Copy ${copyCount})`;
      }

      form.setFields([
        {
          name: 'monitoringName',
          value: newName,
          warnings: ['Auto generated name. Please   modify if necessary.'],
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDuplicating, form]);

  const handleClusterChange = (value: any) => {
    const selectedClusterDetails = clusters.find(cluster => cluster.id === value);
    setSelectedCluster(selectedClusterDetails);
  };

  const getJobs = debounce(async (value: string) => {
    try {
      setFetchingJobs(true);
      const data: any[] = await hpccService.jobSearch({ keyword: value, clusterId: selectedCluster?.id });

      if (data) {
        const cleanedData = data.map((d: any) => ({
          label: d.text,
          value: d.text,
          executionCost: d.ExecuteCost,
          fileAccessCost: d.FileAccessCost,
          compileCost: d.CompileCost,
        }));

        setJobs(cleanedData);
      }
    } catch (err) {
      // ignore
    } finally {
      setFetchingJobs(false);
    }
  }, 500);

  function handleSearch(value: string) {
    getJobs(value);
  }

  const handleJobNameFiledClear = () => {
    setJobs([]);
  };

  return (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Monitoring Name"
          name="monitoringName"
          rules={[
            ...MonitoringNameFormRules,
            () => ({
              validator(_, value: string) {
                if (isEditing) return Promise.resolve();
                if (!value || !doesNameExist({ jobMonitorings, newName: value })) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Monitoring name must be unique'));
              },
            }),
          ]}>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore ref typing for Input */}
          <Input placeholder="Enter a name" ref={monitoringNameInputRef as any} />
        </Form.Item>

        <Form.Item label="Description" name="description" rules={DescriptionFormRules}>
          <TextArea
            placeholder="Enter a short description"
            rows={2}
            maxLength={150}
            showCount
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Cluster" name="clusterId" rules={[{ required: true, message: 'Required field' }]}>
              <Select onChange={value => handleClusterChange(value)}>
                {clusters.map(cluster => (
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
                  Monitoring Scope
                  <InfoCircleOutlined
                    style={{ marginLeft: '.5rem', color: 'var(--primary)' }}
                    onClick={() => {
                      setShowUserGuide(true);
                      setSelectedUserGuideName('jobMonitoringScopeTypes');
                    }}
                  />
                </>
              }
              name="monitoringScope"
              rules={[{ required: true, message: 'Required field' }]}>
              <Select onChange={value => setMonitoringScope(value)}>
                {monitoringScopeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {monitoringScope === 'SpecificJob' && selectedCluster ? (
          <Form.Item
            label={
              <span>
                Job Name
                <span>
                  <InfoCircleOutlined
                    style={{ marginLeft: '.5rem' }}
                    onClick={() => {
                      setShowUserGuide(true);
                      setSelectedUserGuideName('wildcard');
                    }}
                  />
                </span>
              </span>
            }
            name="jobName"
            rules={[
              { required: true, message: 'Required field' },
              { max: 256, message: 'Maximum of 256 characters allowed' },
            ]}>
            {/* AutoComplete option shapes are dynamic - suppress strict typing */}
            <AutoComplete
              options={jobs}
              placeholder="Supports wildcard"
              allowClear
              onSearch={handleSearch}
              onClear={handleJobNameFiledClear}
            />
          </Form.Item>
        ) : null}

        {monitoringScope === 'PatternMatching' && selectedCluster ? (
          <Form.Item
            label={
              <span>
                Job Name pattern
                <span>
                  <InfoCircleOutlined
                    style={{ marginLeft: '.5rem' }}
                    onClick={() => {
                      setShowUserGuide(true);
                      setSelectedUserGuideName('jobNamePattern');
                    }}
                  />
                </span>
              </span>
            }
            name="jobName"
            rules={[
              { required: true, message: 'Required field' },
              { max: 256, message: 'Maximum of 256 characters allowed' },
            ]}>
            <Input placeholder="Enter a pattern" />
          </Form.Item>
        ) : null}

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

      <InfoDrawer
        open={showUserGuide}
        onClose={() => setShowUserGuide(false)}
        width="500px"
        content={selectedUserGuideName}
      />
    </Card>
  );
};

export default JobMonitoringBasicTab;
