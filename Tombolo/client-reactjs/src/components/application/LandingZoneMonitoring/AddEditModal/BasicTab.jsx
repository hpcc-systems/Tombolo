/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Card } from 'antd';
// import LandingZoneFileExplorer from '../../../common/LandingZoneFileExplorer';
import AsrSpecificMonitoring from './ASRSpecificMonitoring';
import { useSelector } from 'react-redux';
import { DescriptionFormRules, MonitoringNameFormRules } from '../../../common/FormRules';

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
  const {
    applicationReducer: {
      application: { applicationId },
      integrations,
    },
  } = useSelector((state) => state);

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
              ...MonitoringNameFormRules,
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
            rules={DescriptionFormRules}>
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
