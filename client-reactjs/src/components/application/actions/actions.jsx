import React from 'react';
import { Tabs } from 'antd';

import LandingZoneUpload from './LandingZoneUpload';
import BreadCrumbs from '../../common/BreadCrumbs';
import Text from '../../common/Text';

function Actions() {
  const TabPane = Tabs.TabPane;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <BreadCrumbs />
      </div>
      <Tabs type="card" defaultActiveKey="1">
        <TabPane tab={<Text text="File Upload" />} key="1">
          <LandingZoneUpload />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default Actions;
