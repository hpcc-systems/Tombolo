// Package imports
import React, { useState, useEffect } from 'react';
import { Tabs, Card, Button, Dropdown, Space, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';

// Local Imports
import BreadCrumbs from '../../../common/BreadCrumbs.jsx';
import GeneralTab from './GeneralTab.jsx';
import DomainsTab from './DomainsTab.jsx';
import ProductsTab from './ProductsTab.jsx';
import GeneralSettingsEditModal from './GeneralSettingsEditModal.jsx';
import { getIntegrationDetailsByRelationId } from '../integration-utils.js';
import { getMonitoringTypes, getDomains, getProducts, getTeamsChannels } from './asr-integration-util.js';
import DomainModal from './DomainModal.jsx';
import ProductModal from './ProductModal.jsx';

// Constants
const { TabPane } = Tabs;

function AsrIntegrationSettings({ integration_to_app_mapping_id }) {
  // Local states
  const [activeTab, setActiveTab] = useState('1');
  const [tabExtraContent, setTabExtraContent] = useState(null);
  const [displayGeneralSettingsEditModal, setDisplayGeneralSettingsEditModal] = useState(false);
  const [integrationDetails, setIntegrationDetails] = useState(null);
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [monitoringTypes, setMonitoringTypes] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [teamsChannels, setTeamsChannels] = useState([]);

  // Action items for the domains tab
  const domainActionItems = [
    {
      label: 'Add Domain',
      onClick: () => setDomainModalOpen(true),
      key: '1',
    },
  ];

  // Action items for the products tab
  const productTabActions = [
    {
      label: 'Add Product',
      onClick: () => setProductModalOpen(true),
      key: '1',
    },
  ];

  // Get integration Details for the selected integration
  useEffect(() => {
    //Get integration details
    (async () => {
      try {
        const integrationDetails = await getIntegrationDetailsByRelationId({
          relationId: integration_to_app_mapping_id,
        });
        setIntegrationDetails(integrationDetails);
      } catch (err) {
        message.error('Unable to get integration details');
      }
    })();

    // Get all monitoring types
    (async () => {
      try {
        const monitoringTypes = await getMonitoringTypes();
        setMonitoringTypes(monitoringTypes);
      } catch (err) {
        return;
      }
    })();
  }, [integration_to_app_mapping_id]);

  // Get all domains and products - only once when the component mounts
  useEffect(() => {
    // Get domains
    (async () => {
      try {
        const domains = await getDomains();
        setDomains(domains);
      } catch (err) {
        return;
      }
    })();

    //Get products
    (async () => {
      try {
        const products = await getProducts();
        setProducts(products);
      } catch (err) {
        return;
      }
    })();

    // Get teams channels
    (async () => {
      try {
        const response = await getTeamsChannels();
        setTeamsChannels(response);
      } catch (err) {
        message.error('Failed to get teams channels');
      }
    })();
  }, []);

  //Handle Tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  // Render tab bar extra content based on the active tab
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
        <Dropdown menu={{ items: domainActionItems }}>
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
        <Dropdown menu={{ items: productTabActions }}>
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

  //JSX return
  return (
    <>
      <BreadCrumbs />
      <Card size="small" style={{ height: '95vh' }}>
        <Tabs
          defaultActiveKey={activeTab}
          tabBarExtraContent={tabExtraContent}
          onChange={(value) => handleTabChange(value)}>
          <TabPane tab="General Settings" key="1">
            {<GeneralTab integrationDetails={integrationDetails} teamsChannels={teamsChannels} />}
          </TabPane>
          <TabPane tab="Domains" key="2">
            <DomainsTab
              domains={domains}
              setDomains={setDomains}
              setSelectedDomain={setSelectedDomain}
              setDomainModalOpen={setDomainModalOpen}
            />
          </TabPane>
          <TabPane tab="Products" key="3">
            <ProductsTab
              products={products}
              setProducts={setProducts}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              setProductModalOpen={setProductModalOpen}
            />
          </TabPane>
        </Tabs>
      </Card>

      {displayGeneralSettingsEditModal && (
        <GeneralSettingsEditModal
          displayGeneralSettingsEditModal={displayGeneralSettingsEditModal}
          setDisplayGeneralSettingsEditModal={setDisplayGeneralSettingsEditModal}
          integrationDetails={integrationDetails}
          setIntegrationDetails={setIntegrationDetails}
          teamsChannels={teamsChannels}
        />
      )}
      <DomainModal
        domainModalOpen={domainModalOpen}
        setDomainModalOpen={setDomainModalOpen}
        monitoringTypes={monitoringTypes}
        domains={domains}
        setDomains={setDomains}
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
      />
      <ProductModal
        productModalOpen={productModalOpen}
        setProductModalOpen={setProductModalOpen}
        domains={domains}
        products={products}
        setProducts={setProducts}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
      />
    </>
  );
}

export default AsrIntegrationSettings;
