import React, { useEffect, useRef, useState } from 'react';
import { Form, Select, Input, Card } from 'antd';
import { matches } from 'validator';
import AsrSpecificMonitoringDetails from '../../common/Monitoring/AsrSpecificMonitoringDetails';
import { useSelector } from 'react-redux';
import InfoDrawer from '../../common/InfoDrawer';
import { DescriptionFormRules, MonitoringNameFormRules } from '../../common/FormRules';
import TagsInput from '@/components/common/TagsInput';

const { Option } = Select;

function CostMonitoringBasicTab({
  form,
  clusters,
  handleClusterChange,
  selectedClusters,
  isDuplicating,
  isEditing,
  costMonitorings,
  domains,
  productCategories,
  setSelectedDomain,
}) {
  const [monitoringScope, setMonitoringScope] = useState('');
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [clusterOffset, setClusterOffset] = useState(null);
  const monitoringNameInputRef = useRef(null);

  const applicationId = useSelector((state) => state.application.application.applicationId);
  const integrations = useSelector((state) => state.application.integrations);

  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  useEffect(() => {
    if (selectedClusters?.[0]?.timezone_offset === null || selectedClusters?.[0]?.timezone_offset === undefined) return;
    const offSet = selectedClusters[0].timezone_offset / 60;
    if (offSet === 0) {
      setClusterOffset('UTC');
    } else {
      setClusterOffset(`UTC ${offSet}`);
    }
  }, [selectedClusters]);

  useEffect(() => {
    if (form) {
      const scope = form.getFieldValue('monitoringScope');
      if (scope) {
        setMonitoringScope(scope);
      }
    }

    if (form && !isEditing) {
      monitoringNameInputRef.current?.input.focus();
    }
  }, [form, isEditing, isDuplicating]);

  useEffect(() => {
    if (isDuplicating) {
      // This function is a temporary fix and only works on the application level
      const doesNameExist = (newName) => {
        return costMonitorings.some((monitoring) => monitoring.monitoringName === newName);
      };

      let currentMonitoringName = form.getFieldValue('monitoringName');
      let newName = `copy-${currentMonitoringName}`;
      let copyCount = 1;

      // Keep incrementing until a unique name is found
      while (doesNameExist(newName)) {
        copyCount++;
        newName = `copy-${currentMonitoringName}-${copyCount}`;
      }

      form.setFields([
        {
          name: 'monitoringName',
          value: newName,
          warnings: ['Auto generated name. Please modify if necessary.'],
        },
      ]);
    }
  }, [isDuplicating, form, costMonitorings, isEditing]);

  return (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item label="Monitoring Name" name="monitoringName" rules={MonitoringNameFormRules}>
          <Input placeholder="Enter monitoring name" ref={monitoringNameInputRef} />
        </Form.Item>
        <Form.Item label="Description" name="description" rules={DescriptionFormRules}>
          <Input.TextArea placeholder="Enter description" />
        </Form.Item>
        <Form.Item
          label="Monitor By"
          name="monitoringScope"
          rules={[{ required: true, message: 'Select a scope to monitor by' }]}>
          <Select placeholder="Select a scope to monitor by" onChange={(value) => setMonitoringScope(value)}>
            <Option key="cm-scope-users" value="users">
              Users
            </Option>
            <Option key="cm-scope-clusters" value="clusters">
              Clusters
            </Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="Clusters"
          name="clusterIds"
          rules={[
            { required: true, message: 'Select at least one cluster' },
            () => ({
              validator(_, value) {
                if (!value || value.length === 0) {
                  return Promise.resolve();
                }
                try {
                  const selected = clusters.filter((c) => value.includes(c.id));
                  if (selected.length <= 1) return Promise.resolve();
                  const firstCode = selected[0]?.currencyCode;
                  const allSame = selected.every((c) => c.currencyCode === firstCode);
                  if (!allSame) {
                    return Promise.reject(
                      new Error('Selected clusters will not be compatible due to differing currency codes')
                    );
                  }
                  return Promise.resolve();
                } catch (e) {
                  return Promise.resolve();
                }
              },
            }),
          ]}>
          <Select
            placeholder="Select at least one cluster"
            mode="multiple"
            onChange={(value) => handleClusterChange(value)}>
            {clusters.map((cluster) => {
              return (
                <Option key={cluster.id} value={cluster.id}>
                  {cluster.name}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        {monitoringScope === 'users' && (
          <Form.Item
            label="Users"
            name="users"
            rules={[
              {
                required: true,
                message: 'Enter at least one user',
                validator: (_, value) => {
                  if (!value || value.length === 0) {
                    return Promise.reject(new Error('Please add at least one email!'));
                  }
                  if (!value.every((v) => v === '*' || matches(v, '^[a-zA-Z0-9._-]+$'))) {
                    return Promise.reject(new Error('Please enter only alphanumeric characters or "*"'));
                  }

                  return Promise.resolve();
                },
              },
            ]}>
            <TagsInput form={form} name="users" placeholder="Enter a list of HPCC users" tokenSeparators={[',']} />
          </Form.Item>
        )}
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
        content="costMonitoringSum"></InfoDrawer>
    </Card>
  );
}

export default CostMonitoringBasicTab;
