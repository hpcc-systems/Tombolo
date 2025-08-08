/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Card } from 'antd';
// import LandingZoneFileExplorer from '../../../common/LandingZoneFileExplorer';
import AsrSpecificMonitoring from './ASRSpecificMonitoring';
import { useSelector } from 'react-redux';

const { TextArea } = Input;

function BasicTab({
  form,
  directoryMonitorings,
  isEditing,
  selectedCluster,
  setSelectedCluster,
  setDirectory,
  copying,
  domains,
  productCategories,
  setSelectedDomain,
  landingZoneMonitoring,
}) {
  //Local State
  const nameRef = useRef(null);
  const [clusterOffset, setClusterOffset] = useState(null);

  //Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const integrations = useSelector((state) => state.application.integrations);

  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
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

  // If duplicating focus on monitoring name input, empty monitoring name field and show error
  useEffect(() => {
    if (form && !isEditing) {
      nameRef.current.focus();
    }

    if (copying) {
      const newName = findUniqueName(form.getFieldValue('monitoringName'));

      form.setFields([
        {
          name: 'monitoringName',
          value: newName,
          warnings: ['Auto generated name'],
        },
      ]);
    }
  }, [copying, form]);

  const findUniqueName = (name) => {
    let i = 1;
    let newName = name + ' ( ' + i + ' )';
    while (landingZoneMonitoring.find((monitoring) => monitoring.name === newName)) {
      i++;
      newName = name + ' ( ' + i + ' )';
    }

    return newName;
  };

  return (
    <>
      <Card size="small" style={{ marginBottom: '1rem' }}>
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
                  if (!value || !landingZoneMonitoring.find((directory) => directory.name === value)) {
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

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { max: 150, message: 'Max character limit is 150' },
              { min: 10, message: 'Minimum of 1 character required' },
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

          {asrIntegration && (
            <AsrSpecificMonitoring
              form={form}
              clusterOffset={clusterOffset}
              domains={domains}
              productCategories={productCategories}
              setSelectedDomain={setSelectedDomain}
            />
          )}
        </Form>
      </Card>
    </>
  );
}

export default BasicTab;
