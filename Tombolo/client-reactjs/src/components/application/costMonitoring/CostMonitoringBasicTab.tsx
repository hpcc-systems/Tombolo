import React, { useEffect, useRef, useState } from 'react';
import { Form, Select, Input, Card, FormInstance } from 'antd';
import { matches } from 'validator';
import AsrSpecificMonitoringDetails from '../../common/Monitoring/AsrSpecificMonitoringDetails';
import { useSelector } from 'react-redux';
import InfoDrawer from '../../common/InfoDrawer';
import { DescriptionFormRules, MonitoringNameFormRules } from '../../common/FormRules';
import TagsInput from '@/components/common/TagsInput';
import type { CostMonitoringDTO } from '@tombolo/shared';

interface Domain {
  value: string;
  label: string;
}

interface ProductCategory {
  value: string;
  label: string;
}

interface Cluster {
  id: string;
  name: string;
  currencyCode?: string;
  timezone_offset?: number | null;
}

interface CostMonitoringBasicTabProps {
  form: FormInstance;
  clusters: Cluster[];
  handleClusterChange: (selectedClusterIds: string[]) => void;
  selectedClusters: string[];
  isDuplicating: boolean;
  isEditing: boolean;
  costMonitorings: CostMonitoringDTO[];
  domains: Domain[];
  productCategories: ProductCategory[];
  setSelectedDomain: (domain: string | null) => void;
}

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
}: CostMonitoringBasicTabProps) {
  const [monitoringScope, setMonitoringScope] = useState('');
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [clusterOffset, setClusterOffset] = useState<string | null>(null);
  const monitoringNameInputRef = useRef<any>(null);

  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const integrations = useSelector((state: any) => state.application.integrations);

  const asrIntegration = integrations.some(
    (integration: any) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  useEffect(() => {
    if (!selectedClusters || selectedClusters.length === 0) return;
    const cluster = clusters.find(c => c.id === selectedClusters[0]);
    if (!cluster || cluster?.timezone_offset === null || cluster?.timezone_offset === undefined) return;
    const offSet = cluster.timezone_offset / 60;
    if (offSet === 0) {
      setClusterOffset('UTC');
    } else {
      setClusterOffset(`UTC ${offSet}`);
    }
  }, [selectedClusters, clusters]);

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
      const doesNameExist = (newName: string) => {
        return costMonitorings.some(monitoring => monitoring.monitoringName === newName);
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
          <Select placeholder="Select a scope to monitor by" onChange={(value: string) => setMonitoringScope(value)}>
            <Select.Option key="cm-scope-users" value="users">
              Users
            </Select.Option>
            <Select.Option key="cm-scope-clusters" value="clusters">
              Clusters
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="Clusters"
          name="clusterIds"
          rules={[
            { required: true, message: 'Select at least one cluster' },
            () => ({
              validator(_: any, value: string[]) {
                if (!value || value.length === 0) {
                  return Promise.resolve();
                }
                try {
                  const selected = clusters.filter(c => value.includes(c.id));
                  if (selected.length <= 1) return Promise.resolve();
                  const firstCode = selected[0]?.currencyCode;
                  const allSame = selected.every(c => c.currencyCode === firstCode);
                  if (!allSame) {
                    return Promise.reject(
                      new Error('Selected clusters will not be compatible due to differing currency codes')
                    );
                  }
                  return Promise.resolve();
                } catch {
                  return Promise.resolve();
                }
              },
            }),
          ]}>
          <Select
            placeholder="Select at least one cluster"
            mode="multiple"
            onChange={(value: string[]) => handleClusterChange(value)}>
            {clusters.map(cluster => {
              return (
                <Select.Option key={cluster.id} value={cluster.id}>
                  {cluster.name}
                </Select.Option>
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
                validator: (_: any, value: string[]) => {
                  if (!value || value.length === 0) {
                    return Promise.reject(new Error('Please add at least one email!'));
                  }
                  if (!value.every(v => v === '*' || matches(v, '^[a-zA-Z0-9._-]+$'))) {
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
