import React, { useState } from 'react';
import { Form, Select, AutoComplete, Input, Card } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

import { authHeader, handleError } from '../../common/AuthHeader.js';
import InfoDrawer from '../../common/InfoDrawer';

const { Option } = Select;
const { TextArea } = Input;

//Monitoring scope options
const monitoringScopeOptions = [
  {
    label: 'Specific job',
    value: 'SpecificJob',
  },
  {
    label: 'Cluster-wide monitoring',
    value: 'ClusterWideMonitoring',
  },
  {
    label: 'Monitoring by Job Pattern',
    value: 'PatternMatching',
  },
];

function JobMonitoringBasicTab({ form, clusters, monitoringScope, setMonitoringScope, jobMonitorings, isEditing }) {
  //Local State
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [selectedUserGuideName, setSelectedUserGuideName] = useState('');
  const [jobs, setJobs] = useState([]);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);

  // Get jobs function
  const getJobs = debounce(async (value) => {
    try {
      setFetchingJobs(true);
      const payload = {
        method: 'POST',
        header: authHeader(),
        body: JSON.stringify({ keyword: value, clusterId: selectedCluster }),
      };

      const response = await fetch(`/api/hpcc/read/jobsearch`, payload);

      if (!response.ok) handleError(response);

      const data = await response.json();

      if (data) {
        const cleanedData = data.map((d) => {
          return {
            label: d.text,
            value: d.text,
            executionCost: d.ExecuteCost,
            fileAccessCost: d.FileAccessCost,
            compileCost: d.CompileCost,
          };
        });

        setJobs(cleanedData);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setFetchingJobs(false);
    }
  }, 500);

  // When user starts typing in job name
  function handleSearch(value) {
    getJobs(value);
  }

  // When job name field is cleared
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
            { required: true, message: 'Required filed' },
            { max: 100, message: 'Maximum of 100 characters allowed' },
            () => ({
              validator(_, value) {
                if (isEditing) return Promise.resolve();
                if (!value || !jobMonitorings.find((job) => job.monitoringName === value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Monitoring name must be unique'));
              },
            }),
          ]}>
          <Input placeholder="Enter a name" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { max: 150, message: 'Max character limit is 150' },
            { required: true, message: 'Add short description' },
          ]}>
          <TextArea
            type="text-area"
            placeholder="Enter a short description"
            rows="2"
            maxLength={150}
            showCount
            autoSize={{
              minRows: 2,
              maxRows: 4,
            }}
          />
        </Form.Item>

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
          <Select
            onChange={(value) => {
              setMonitoringScope(value);
            }}>
            {monitoringScopeOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Cluster" name="clusterId" rules={[{ required: true, message: 'Required filed' }]}>
          <Select onChange={(value) => setSelectedCluster(value)}>
            {clusters.map((cluster) => {
              return (
                <Option key={cluster.id} value={cluster.id}>
                  {cluster.name}
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        {monitoringScope === 'SpecificJob' ? (
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
              { required: true, message: 'Required filed' },
              { max: 256, message: 'Maximum of 256 characters allowed' },
            ]}>
            <AutoComplete
              options={jobs}
              placeholder="Supports wildcard"
              allowClear
              onSearch={handleSearch}
              onClear={handleJobNameFiledClear}
              loading={fetchingJobs}></AutoComplete>
          </Form.Item>
        ) : null}

        {monitoringScope === 'PatternMatching' ? (
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
              { required: true, message: 'Required filed' },
              { max: 256, message: 'Maximum of 256 characters allowed' },
            ]}>
            <Input placeholder="Enter a pattern" />
          </Form.Item>
        ) : null}
      </Form>

      <InfoDrawer
        open={showUserGuide}
        onClose={() => setShowUserGuide(false)}
        width="500px"
        content={selectedUserGuideName}></InfoDrawer>
    </Card>
  );
}

export default JobMonitoringBasicTab;
