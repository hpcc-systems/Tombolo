import React, { useState, useEffect, useRef } from 'react';
import { Form, Select, Input, Card } from 'antd';
import LandingZoneFileExplorer from '../../../common/LandingZoneFileExplorer';
import { InfoCircleOutlined } from '@ant-design/icons';
import InfoDrawer from '../../../common/InfoDrawer';
import { DescriptionFormRules, MonitoringNameFormRules } from '../../../common/FormRules';

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
  copying,
  selectedMonitoring = { selectedMonitoring },
}) {
  //Local State
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [selectedUserGuideName, setSelectedUserGuideName] = useState('');
  const nameRef = useRef(null);

  // Handle cluster change
  const handleClusterChange = (value) => {
    const selectedClusterDetails = clusters.find((cluster) => cluster.id === value);
    setSelectedCluster(selectedClusterDetails);
  };

  // If duplicating focus on monitoring name input, empty monitoring name field and show error
  useEffect(() => {
    if (form && !isEditing) {
      nameRef.current.focus();
    }

    if (copying) {
      const newName = findUniqueName(form.getFieldValue('name'));

      form.setFields([
        {
          name: 'name',
          value: newName,
          warnings: ['Auto generated name'],
        },
      ]);
    }
  }, [copying, form]);

  const findUniqueName = (name) => {
    let i = 1;
    let newName = name + ' ( ' + i + ' )';
    while (directoryMonitorings.find((directory) => directory.name === newName)) {
      i++;
      newName = name + ' ( ' + i + ' )';
    }

    return newName;
  };

  return (
    <>
      <Card>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Monitoring Name"
            name="name"
            rules={[
              ...MonitoringNameFormRules,
              () => ({
                validator(_, value) {
                  if (isEditing) return Promise.resolve();
                  if (!value || !directoryMonitorings.find((directory) => directory.name === value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Monitoring name must be unique'));
                },
              }),
            ]}>
            <Input
              placeholder="Enter a name"
              ref={nameRef}
              onBlur={() =>
                form.setFields([
                  {
                    name: 'name',
                    warnings: [],
                  },
                ])
              }
            />
          </Form.Item>

          <Form.Item label="Description" name="description" rules={DescriptionFormRules}>
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

          {selectedCluster || selectedMonitoring?.cluster_id ? (
            <Form.Item name="directoryName" rules={[{ max: 256, message: 'Maximum of 256 characters allowed' }]}>
              <LandingZoneFileExplorer
                clusterId={selectedCluster?.id || selectedMonitoring?.cluster_id}
                DirectoryOnly={true}
                setLandingZoneRootPath={setDirectory}
                enableEdit={true}
                form={form}
                selectedMonitoring={selectedMonitoring}
              />
            </Form.Item>
          ) : null}

          {selectedCluster || selectedMonitoring?.cluster_id ? (
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
