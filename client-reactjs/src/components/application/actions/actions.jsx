import React from 'react';
import { Tabs } from 'antd';
import { useTranslation } from 'react-i18next';

import LandingZoneUpload from './LandingZoneUpload';
import BreadCrumbs from '../../common/BreadCrumbs';

function Actions() {
  const TabPane = Tabs.TabPane;
  const { t } = useTranslation(['common', 'fileUpload']); // t for translate -> getting namespaces relevant to this file

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <BreadCrumbs />
      </div>
      <Tabs defaultActiveKey="1">
        <TabPane tab={t('File Upload', { ns: 'fileUpload' })} key="1">
          <LandingZoneUpload />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default Actions;
