import React, { useState } from 'react';
import { Button, Card, Descriptions } from 'antd';
import BreadCrumbs from '../../../common/BreadCrumbs';
import { handleError, handleSuccess } from '../../../common/handleResponse';
import integrationsService from '@/services/integrations.service';

interface Props {
  integration_to_app_mapping_id?: string;
}

const HpccToolsIntegrationSettings: React.FC<Props> = ({ integration_to_app_mapping_id }) => {
  const [isTriggeringSync, setIsTriggeringSync] = useState(false);

  const triggerManualSync = async () => {
    if (!integration_to_app_mapping_id) {
      handleError('HPCC Tools integration mapping is missing for this application');
      return;
    }

    try {
      setIsTriggeringSync(true);
      await integrationsService.triggerHpccToolsManualSync({
        integrationMappingId: integration_to_app_mapping_id,
      });
      handleSuccess('HPCC Tools sync job queued');
    } catch (_error) {
      handleError('Failed to queue HPCC Tools sync job');
    } finally {
      setIsTriggeringSync(false);
    }
  };

  return (
    <>
      <BreadCrumbs />
      <Card title="HPCC Tools Integration">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Sync Frequency">Daily (midnight)</Descriptions.Item>
          <Descriptions.Item label="Description">
            Tombolo automatically clones and updates the hpcc-tools repository on a recurring schedule. Enabling this
            integration activates the daily sync job and exposes the HPCC Tools documentation viewer in the left
            navigation.
          </Descriptions.Item>
          <Descriptions.Item label="Manual Sync">
            <Button type="primary" onClick={triggerManualSync} loading={isTriggeringSync}>
              Sync Now
            </Button>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
};

export default HpccToolsIntegrationSettings;
