import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Card } from 'antd';
import AsrSpecificMonitoring from './ASRSpecificMonitoring';
import { useSelector } from 'react-redux';
import { DescriptionFormRules, MonitoringNameFormRules } from '../../../common/FormRules';

const { TextArea } = Input;

function BasicTab({
  form,
  landingZoneMonitoring,
  isEditing,
  selectedCluster,
  copying,
  domains,
  productCategories,
  setSelectedDomain,
}: any) {
  const nameRef = useRef<any>(null);
  const [clusterOffset, setClusterOffset] = useState<string | null>(null);

  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const integrations = useSelector((state: any) => state.application.integrations);

  const asrIntegration = integrations.some((integration: any) => integration.name === 'ASR' && integration.application_id === applicationId);

  useEffect(() => {
    if (selectedCluster?.timezone_offset === null || selectedCluster?.timezone_offset === undefined) return;
    const offSet = selectedCluster.timezone_offset / 60;
    if (offSet === 0) setClusterOffset('UTC');
    else setClusterOffset(`UTC ${offSet}`);
  }, [selectedCluster]);

  useEffect(() => {
    if (form && !isEditing) {
      nameRef.current.focus();
    }

    if (copying) {
      const newName = findUniqueName(form.getFieldValue('monitoringName'));
      form.setFields([{ name: 'monitoringName', value: newName, warnings: ['Auto generated name'] }]);
    }
  }, [copying, form]);

  const findUniqueName = (name: string) => {
    let i = 1;
    let newName = name + ' ( ' + i + ' )';
    while (landingZoneMonitoring.find((monitoring: any) => monitoring.name === newName)) {
      i++;
      newName = name + ' ( ' + i + ' )';
    }
    return newName;
  };

  return (
    <Card size="small" style={{ marginBottom: '1rem' }}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Monitoring Name"
          name="monitoringName"
          rules={[
            ...MonitoringNameFormRules,
            () => ({
              validator(_, value: string) {
                if (isEditing) return Promise.resolve();
                if (!value || !landingZoneMonitoring.find((directory: any) => directory.name === value)) return Promise.resolve();
                return Promise.reject(new Error('Monitoring name must be unique'));
              },
            }),
          ]}>
          <Input placeholder="Enter a name" ref={nameRef} onBlur={() => form.setFields([{ name: 'name', warnings: [] }])} />
        </Form.Item>

        <Form.Item label="Description" name="description" rules={DescriptionFormRules}>
          <TextArea placeholder="Enter a short description" rows={2} maxLength={150} showCount autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>

        {asrIntegration && (
          <AsrSpecificMonitoring form={form} clusterOffset={clusterOffset} domains={domains} productCategories={productCategories} setSelectedDomain={setSelectedDomain} />
        )}
      </Form>
    </Card>
  );
}

export default BasicTab;
