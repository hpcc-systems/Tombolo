import React from 'react';
import { Card, Descriptions } from 'antd';
import BreadCrumbs from '../../../common/BreadCrumbs';

interface Props {
  integration_to_app_mapping_id?: string;
}

const HpccToolsIntegrationSettings: React.FC<Props> = () => {
  return (
    <>
      <BreadCrumbs />
      <Card title="HPCC Tools Integration">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Repository">https://github.com/hpcc-systems/hpcc-tools</Descriptions.Item>
          <Descriptions.Item label="Sync Frequency">Every hour</Descriptions.Item>
          <Descriptions.Item label="Description">
            Tombolo automatically clones and updates the hpcc-tools repository on a recurring schedule. Enabling this
            integration activates the hourly sync job and exposes the HPCC Tools documentation viewer in the left
            navigation.
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
};

export default HpccToolsIntegrationSettings;
