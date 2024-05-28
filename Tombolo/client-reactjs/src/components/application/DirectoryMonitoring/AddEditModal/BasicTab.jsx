import React, { useState } from 'react';
import { Form, Select, Input, Card } from 'antd';
import LandingZoneFileExplorer from '../../../common/LandingZoneFileExplorer';
import { InfoCircleOutlined } from '@ant-design/icons';
import InfoDrawer from '../../../common/InfoDrawer';

const { Option } = Select;
const { TextArea } = Input;

function BasicTab({
  form,
  clusters,
  directoryMonitorings,
  isEditing,
  selectedCluster,
  setSelectedCluster,
  setDirectory,
}) {
  //Local State
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [selectedUserGuideName, setSelectedUserGuideName] = useState('');

  // Handle cluster change
  const handleClusterChange = (value) => {
    const selectedClusterDetails = clusters.find((cluster) => cluster.id === value);
    setSelectedCluster(selectedClusterDetails);
  };

  return (
    <>
      <Card>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Monitoring Name"
            name="name"
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

          <Form.Item label="Cluster" name="cluster_id" rules={[{ required: true, message: 'Required field' }]}>
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
            <Form.Item name="directoryName" rules={[{ max: 256, message: 'Maximum of 256 characters allowed' }]}>
              <LandingZoneFileExplorer
                clusterId={selectedCluster.id}
                DirectoryOnly={true}
                setLandingZoneRootPath={setDirectory}
                enableEdit={true}
              />
            </Form.Item>
          ) : null}

          {selectedCluster ? (
            <Form.Item
              label={
                <>
                  <span>File Name pattern</span>
                  <InfoCircleOutlined
                    style={{ marginLeft: '.5rem', color: 'var(--primary)' }}
                    onClick={() => {
                      setShowUserGuide(true);
                      setSelectedUserGuideName('wildcard');
                    }}
                  />
                </>
              }
              name="pattern"
              rules={[{ max: 256, message: 'Maximum of 256 characters allowed' }]}>
              <Input placeholder="Enter a pattern" />
            </Form.Item>
          ) : null}
        </Form>
      </Card>

      <InfoDrawer
        open={showUserGuide}
        onClose={() => setShowUserGuide(false)}
        width="500px"
        content={selectedUserGuideName}></InfoDrawer>
    </>
  );
}

export default BasicTab;
