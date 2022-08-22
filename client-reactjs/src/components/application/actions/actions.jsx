import React from 'react';
import { Tabs } from 'antd';
import LandingZoneUpload from './LandingZoneUpload';
import BreadCrumbs from '../../common/BreadCrumbs';

function Actions() {
  const TabPane = Tabs.TabPane;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <BreadCrumbs />
      </div>
      <Tabs defaultActiveKey="1">
        <TabPane tab="File Upload" key="1">
          <LandingZoneUpload />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default Actions;
