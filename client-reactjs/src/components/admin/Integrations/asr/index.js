/* eslint-disable unused-imports/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Tabs, Card, Button, Dropdown, Space, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import BreadCrumbs from '../../../common/BreadCrumbs.js';
// import ASRForm from './ASRForm.js';
import GeneralTab from './GeneralTab.jsx';
import DomainsTab from './DomainsTab.jsx';
import ProductsTab from './ProductsTab.jsx';
import GeneralSettingsEditModal from './GeneralSettingsEditModal.jsx';
import { getIntegrationByName } from '../integration-utils.js';

const { TabPane } = Tabs;

const items = [
  {
    label: 'Add New Domain',
    key: '1',
  },
  {
    label: 'Delete selected',
    key: '2',
  },
];
const menuProps = {
  items,
};

function AsrIntegrationSettings({ integrationName }) {
  const [activeTab, setActiveTab] = useState('1');
  const [editingTab, setEditingTab] = useState(null);
  const [tabExtraContent, setTabExtraContent] = useState(null);
  const [displayGeneralSettingsEditModal, setDisplayGeneralSettingsEditModal] = useState(false);
  const [integrationDetails, setIntegrationDetails] = useState(null);

  // Get integration Details for the selected integration
  useEffect(() => {
    (async () => {
      try {
        const integrationDetails = await getIntegrationByName(integrationName);
        console.log('------------------------------------------');
        console.log(integrationDetails);
        console.log('------------------------------------------');
        setIntegrationDetails(integrationDetails);
      } catch (err) {
        message.error('Unable to get integration details');
      }
    })();
  }, []);

  //Handle Tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  // Render tab bar extra content
  useEffect(() => {
    if (activeTab === '1') {
      setTabExtraContent(
        <Button type="primary" onClick={() => setDisplayGeneralSettingsEditModal(true)}>
          Edit
        </Button>
      );
    }

    if (activeTab === '2') {
      setTabExtraContent(
        <Dropdown menu={menuProps}>
          <Button type="primary">
            <Space>
              Actions
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
      );
    }

    if (activeTab === '3') {
      setTabExtraContent(
        <Dropdown menu={menuProps}>
          <Button type="primary">
            <Space>
              Actions
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
      );
    }
  }, [activeTab]);

  return (
    <>
      <BreadCrumbs />
      <Card size="small">
        <Tabs
          defaultActiveKey={activeTab}
          tabBarExtraContent={tabExtraContent}
          onChange={(value) => handleTabChange(value)}>
          <TabPane tab="General Settings" key="1">
            {<GeneralTab integrationDetails={integrationDetails} />}
          </TabPane>
          <TabPane tab="Domains" key="2">
            <DomainsTab />
          </TabPane>
          <TabPane tab="Products" key="3">
            <ProductsTab />
          </TabPane>
          {/* <TabPane tab="Old" key="4">
            <ASRForm />
          </TabPane> */}
        </Tabs>
      </Card>
      <GeneralSettingsEditModal
        displayGeneralSettingsEditModal={displayGeneralSettingsEditModal}
        setDisplayGeneralSettingsEditModal={setDisplayGeneralSettingsEditModal}
      />
    </>
  );
}

export default AsrIntegrationSettings;
