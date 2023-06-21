import React, { useState } from 'react';
import { Form, Select, AutoComplete } from 'antd';
import { debounce } from 'lodash';

import { authHeader, handleError } from '../../common/AuthHeader.js';

const { Option } = Select;

const monitoringScopeOptions = [
  { label: 'Specific job', value: 'individualJob' },
  { label: 'Cluster', value: 'cluster' },
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
          label="Job name"
          name="jobName"
          rules={[
            { required: true, message: 'Required filed' },
            { max: 256, message: 'Maximum of 256 characters allowed' },
          ]}>
          <AutoComplete
            options={jobs}
            filterOption={true}
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
