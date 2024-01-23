import React, { useState } from 'react';
import { Form, Select, AutoComplete } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

import { authHeader, handleError } from '../../common/AuthHeader.js';
import InfoDrawer from '../../common/InfoDrawer';

const { Option } = Select;

const monitoringScopeOptions = [
  { label: 'Single Job Monitoring', value: 'individualJob' },
  { label: 'Cluster-Wide Monitoring', value: 'cluster' },
];

function ClusterMonitoringBasicTab({
  clusters,
  handleClusterChange,
  selectedCluster,
  monitoringScope,
  setMonitoringScope,
  setSelectedJob,
}) {
  const [jobs, setJobs] = useState([]);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

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

  //When job is selected
  const onJobSelect = (jobName) => {
    const selectedJobDetails = jobs.find((job) => job.value === jobName);
    setSelectedJob(selectedJobDetails);
  };

  return (
    <>
      <Form.Item label="Cluster" name="cluster_id" rules={[{ required: true, message: 'Required filed' }]}>
        <Select onChange={(value) => handleClusterChange(value)}>
          {clusters.map((cluster) => {
            return (
              <Option key={cluster.id} value={cluster.id}>
                {cluster.name}
              </Option>
            );
          })}
        </Select>
      </Form.Item>

      <Form.Item
        label="Monitoring Scope"
        name="monitoringScope"
        rules={[{ required: true, message: 'Required filed' }]}>
        <Select
          onChange={(value) => {
            setMonitoringScope(value);
          }}>
          {monitoringScopeOptions.map((scope) => {
            return (
              <Option key={scope.value} value={scope.value}>
                {scope.label}
              </Option>
            );
          })}
        </Select>
      </Form.Item>

      {selectedCluster && monitoringScope === 'individualJob' ? (
        <Form.Item
          label={
            <span>
              Job Name
              <span>
                <InfoCircleOutlined style={{ marginLeft: '.5rem' }} onClick={() => showDrawer()} />
              </span>
              <InfoDrawer open={open} onClose={onClose} width="500px" content="wildcard"></InfoDrawer>
            </span>
          }
          name="jobName"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            { required: true, message: 'Required filed' },
            { max: 256, message: 'Maximum of 256 characters allowed' },
          ]}>
          <AutoComplete
            options={jobs}
            placeholder="Supports wildcard"
            validateTrigger={['onChange', 'onBlur']}
            allowClear
            onSearch={handleSearch}
            onClear={handleJobNameFiledClear}
            onSelect={(jobName) => onJobSelect(jobName)}
            loading={fetchingJobs}></AutoComplete>
        </Form.Item>
      ) : null}
    </>
  );
}

export default ClusterMonitoringBasicTab;
