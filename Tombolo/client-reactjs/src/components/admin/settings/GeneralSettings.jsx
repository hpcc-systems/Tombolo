// Import from Libraries
import React from 'react';
import { Descriptions } from 'antd';

// Local Imports
import { formatDateTimeShort } from '../../common/CommonUtil';

function GeneralSettings({ instanceSettings }) {
  return (
    <Descriptions
      column={1}
      layout="horizontal"
      bordered={false}
      size="small"
      labelStyle={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
      <Descriptions.Item label="Instance Name"> {instanceSettings.name}</Descriptions.Item>
      <Descriptions.Item label="Description">{instanceSettings?.metaData?.description}</Descriptions.Item>

      <Descriptions.Item label="Created by">
        {`${instanceSettings?.creator?.firstName} ${instanceSettings?.creator?.lastName}`}
      </Descriptions.Item>
      <Descriptions.Item label="Created on">{formatDateTimeShort(instanceSettings?.createdAt)}</Descriptions.Item>
    </Descriptions>
  );
}

export default GeneralSettings;
