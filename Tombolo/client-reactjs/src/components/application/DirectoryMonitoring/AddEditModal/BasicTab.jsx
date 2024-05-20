import React, { useState } from 'react';
import { Form, Select, AutoComplete, Input, Card } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

import { authHeader, handleError } from '../../../common/AuthHeader.js';
import InfoDrawer from '../../../common/InfoDrawer.jsx';

const { Option } = Select;
const { TextArea } = Input;

function BasicTab({ form, clusters, directoryMonitorings, isEditing, selectedCluster, setSelectedCluster }) {
  //Local State
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [selectedUserGuideName, setSelectedUserGuideName] = useState('');
  const [directorys, setDirectorys] = useState([]);
  const [fetchingDirectorys, setFetchingDirectorys] = useState(false);
  // const [selectedCluster, setSelectedCluster] = useState(null);

  // Handle cluster change
  const handleClusterChange = (value) => {
    // set details about selected cluster
    const selectedClusterDetails = clusters.find((cluster) => cluster.id === value);
    setSelectedCluster(selectedClusterDetails);
  };

  // Get directorys function
  const getDirectorys = debounce(async (value) => {
    try {
      setFetchingDirectorys(true);
      const payload = {
        method: 'POST',
        header: authHeader(),
        body: JSON.stringify({ keyword: value, clusterId: selectedCluster.id }),
      };

      const response = await fetch(`/api/hpcc/read/directorysearch`, payload);

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

        setDirectorys(cleanedData);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setFetchingDirectorys(false);
    }
  }, 500);

  // When user starts typing in directory name
  function handleSearch(value) {
    getDirectorys(value);
  }

  // When directory name field is cleared
  const handleDirectoryNameFiledClear = () => {
    setDirectorys([]);
  };

  return (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Monitoring Name"
          name="monitoringName"
          rules={[
            { required: true, message: 'Required field' },
            { max: 100, message: 'Maximum of 100 characters allowed' },
            () => ({
              validator(_, value) {
                if (isEditing) return Promise.resolve();
                if (!value || !directoryMonitorings.find((directory) => directory.monitoringName === value)) {
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

        {selectedCluster ? (
          <Form.Item
            label={
              <span>
                Directory Name
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
            name="directoryName"
            rules={[
              { required: true, message: 'Required field' },
              { max: 256, message: 'Maximum of 256 characters allowed' },
            ]}>
            <AutoComplete
              options={directorys}
              placeholder="Supports wildcard"
              allowClear
              onSearch={handleSearch}
              onClear={handleDirectoryNameFiledClear}
              loading={fetchingDirectorys}></AutoComplete>
          </Form.Item>
        ) : null}

        {selectedCluster ? (
          <Form.Item
            label={
              <span>
                Directory Name pattern
                <span>
                  <InfoCircleOutlined
                    style={{ marginLeft: '.5rem' }}
                    onClick={() => {
                      setShowUserGuide(true);
                      setSelectedUserGuideName('directoryNamePattern');
                    }}
                  />
                </span>
              </span>
            }
            name="directoryName"
            rules={[
              { required: true, message: 'Required field' },
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

export default BasicTab;
