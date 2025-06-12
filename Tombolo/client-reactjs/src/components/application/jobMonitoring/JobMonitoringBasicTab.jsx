import React, { useState, useEffect, useRef } from 'react';
import { Form, Select, AutoComplete, Input, Card, Row, Col } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import { useSelector } from 'react-redux';

import { authHeader, handleError } from '../../common/AuthHeader.js';
import InfoDrawer from '../../common/InfoDrawer';
import { doesNameExist } from './jobMonitoringUtils';
import AsrSpecificMonitoringDetails from './AsrSpecificMonitoringDetails';

const { Option } = Select;
const { TextArea } = Input;

//Monitoring scope options
const monitoringScopeOptions = [
  {
    label: 'Specific job',
    value: 'SpecificJob',
  },
  {
    label: 'Monitoring by Job Pattern',
    value: 'PatternMatching',
  },
];

function JobMonitoringBasicTab({
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
}) {
  //Local State
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [selectedUserGuideName, setSelectedUserGuideName] = useState('');
  const [jobs, setJobs] = useState([]);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [clusterOffset, setClusterOffset] = useState(null);

  const monitoringNameInputRef = useRef(null);

  // Redux
  const {
    applicationReducer: {
      application: { applicationId },
      integrations,
    },
  } = useSelector((state) => state);
  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  // Generating cluster offset string to display in time picker
  useEffect(() => {
    if (selectedCluster?.timezone_offset === null || selectedCluster?.timezone_offset === undefined) return;
    const offSet = selectedCluster.timezone_offset / 60;
    if (offSet == 0) {
      setClusterOffset('UTC');
    } else {
      setClusterOffset(`UTC ${offSet}`);
    }
  }, [selectedCluster]);

  // If duplicating focus on monitoring name input, empty monitoring name field and show warning message
  useEffect(() => {
    if (form && !isEditing) {
      monitoringNameInputRef.current.focus();
    }

    if (isDuplicating) {
      let currentMonitoringName = form.getFieldValue('monitoringName');
      let copyCount = 1;

      // Extract base name and copy count from the current name
      const match = currentMonitoringName.match(/^(.*) \(Copy (\d+)\)$/);
      if (match) {
        currentMonitoringName = match[1];
        copyCount = parseInt(match[2]) + 1;
      }

      let newName = `${currentMonitoringName} (Copy ${copyCount})`;

      // Keep incrementing the copy count until a unique name is found
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
  }, [isDuplicating, form]);

  // Handle cluster change
  const handleClusterChange = (value) => {
    // set details about selected cluster
    const selectedClusterDetails = clusters.find((cluster) => cluster.id === value);
    setSelectedCluster(selectedClusterDetails);
  };

  // Get jobs function
  const getJobs = debounce(async (value) => {
    try {
      setFetchingJobs(true);
      const payload = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ keyword: value, clusterId: selectedCluster.id }),
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
          // validateTrigger="onBlur"
          rules={[
            { required: true, message: 'Required field' },
            { max: 100, message: 'Maximum of 100 characters allowed' },
            () => ({
              validator(_, value) {
                if (isEditing) return Promise.resolve();
                if (!value || !doesNameExist({ jobMonitorings, newName: value })) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Monitoring name must be unique'));
              },
            }),
          ]}>
          <Input placeholder="Enter a name" ref={monitoringNameInputRef} />
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Cluster" name="clusterId" rules={[{ required: true, message: 'Required field' }]}>
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
            <AutoComplete
              options={jobs}
              placeholder="Supports wildcard"
              allowClear
              onSearch={handleSearch}
              onClear={handleJobNameFiledClear}
              loading={fetchingJobs}></AutoComplete>
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
        content={selectedUserGuideName}></InfoDrawer>
    </Card>
  );
}

export default JobMonitoringBasicTab;
