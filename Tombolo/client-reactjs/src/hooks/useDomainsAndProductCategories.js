import { useEffect, useState } from 'react';
import { message } from 'antd';
import { getDomains, getProductCategories } from '../components/common/ASRTools';

export const useDomainAndCategories = (monitoringTypeId, selectedMonitoring) => {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [productCategories, setProductCategories] = useState([]);

  useEffect(() => {
    // Fetch domains
    const fetchDomains = async () => {
      if (!monitoringTypeId) return;
      try {
        let domainData = await getDomains({ monitoringTypeId });
        domainData = domainData.map((d) => ({
          label: d.name,
          value: d.id,
        }));
        setDomains(domainData);
      } catch (error) {
        message.error('Error fetching domains');
      }
    };

    // Set selected domain from selectedMonitoring
    const setDomainFromMonitoring = () => {
      if (selectedMonitoring?.metaData?.asrSpecificMetaData?.domain) {
        setSelectedDomain(selectedMonitoring.metaData.asrSpecificMetaData.domain);
      }
    };

    // Fetch product categories
    const fetchProductCategories = async () => {
      if (!selectedDomain) return;
      try {
        const productCategories = await getProductCategories({ domainId: selectedDomain });
        const formattedProductCategories = productCategories.map((c) => ({
          label: `${c.shortCode} - ${c.name}`,
          value: c.id,
        }));
        setProductCategories(formattedProductCategories);
      } catch (error) {
        message.error('Error fetching product category');
      }
    };

    fetchDomains();
    setDomainFromMonitoring();
    fetchProductCategories();
  }, [monitoringTypeId, selectedMonitoring, selectedDomain]);

  return { domains, setDomains, selectedDomain, setSelectedDomain, productCategories, setProductCategories };
};
