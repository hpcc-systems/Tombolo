import React, { useState, useEffect } from 'react';
import { Tabs, Card, Button, Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { handleError } from '../../../common/handleResponse';

import BreadCrumbs from '../../../common/BreadCrumbs';
import GeneralTab from './GeneralTab';
import DomainsTab from './DomainsTab';
import ProductsTab from './ProductsTab';
import GeneralSettingsEditModal from './GeneralSettingsEditModal';
import integrationsService from '@/services/integrations.service';
import monitoringTypeService from '@/services/monitoringType.service';
import asrService from '@/services/asr.service';
import DomainModal from './DomainModal';
import ProductModal from './ProductModal';

const { TabPane } = Tabs;

interface Props {
  integration_to_app_mapping_id?: string;
}

const AsrIntegrationSettings: React.FC<Props> = ({ integration_to_app_mapping_id }) => {
  const [activeTab, setActiveTab] = useState<string>('1');
  const [tabExtraContent, setTabExtraContent] = useState<React.ReactNode | null>(null);
  const [displayGeneralSettingsEditModal, setDisplayGeneralSettingsEditModal] = useState<boolean>(false);
  const [integrationDetails, setIntegrationDetails] = useState<any>(null);
  const [domainModalOpen, setDomainModalOpen] = useState<boolean>(false);
  const [productModalOpen, setProductModalOpen] = useState<boolean>(false);
  const [monitoringTypes, setMonitoringTypes] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [teamsChannels, setTeamsChannels] = useState<any[]>([]);

  const domainActionItems = [{ label: 'Add Domain', onClick: () => setDomainModalOpen(true), key: '1' }];

  const productTabActions = [{ label: 'Add Product', onClick: () => setProductModalOpen(true), key: '1' }];

  useEffect(() => {
    (async () => {
      try {
        const integrationDetails = await integrationsService.getDetailsByRelationId({
          relationId: integration_to_app_mapping_id,
        });
        setIntegrationDetails(integrationDetails);
      } catch (err) {
        handleError('Unable to get integration details');
      }
    })();

    (async () => {
      try {
        const monitoringTypes = await monitoringTypeService.getAll();
        setMonitoringTypes(monitoringTypes);
      } catch (err) {
        return;
      }
    })();
  }, [integration_to_app_mapping_id]);

  useEffect(() => {
    (async () => {
      try {
        const domains = await asrService.getAllDomains();
        setDomains(domains);
      } catch (err) {
        return;
      }
    })();

    (async () => {
      try {
        const products = await asrService.getAllProducts();
        setProducts(products);
      } catch (err) {
        return;
      }
    })();

    (async () => {
      try {
        const response = await asrService.getTeamsChannels();
        setTeamsChannels(response);
      } catch (err) {
        handleError('Failed to get teams channels');
      }
    })();
  }, []);

  const handleTabChange = (value: string) => setActiveTab(value);

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

  return (
    <>
      <BreadCrumbs />
      <Card size="small" style={{ height: '95vh' }}>
        <Tabs defaultActiveKey={activeTab} tabBarExtraContent={tabExtraContent} onChange={v => handleTabChange(v)}>
          <TabPane tab="General Settings" key="1">
            <GeneralTab integrationDetails={integrationDetails} teamsChannels={teamsChannels} />
          </TabPane>
          <TabPane tab="Domains" key="2">
            <DomainsTab
              domains={domains}
              setSelectedDomain={setSelectedDomain}
              setDomainModalOpen={setDomainModalOpen}
            />
          </TabPane>
          <TabPane tab="Products" key="3">
            <ProductsTab
              products={products}
              setProducts={setProducts}
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
        setProducts={setProducts}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
      />
    </>
  );
};

export default AsrIntegrationSettings;
