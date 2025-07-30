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

    fetchDomains();
  }, [monitoringTypeId]);

  // Separate useEffect for setting domain from monitoring
  useEffect(() => {
    if (selectedMonitoring?.metaData?.asrSpecificMetaData?.domain) {
      setSelectedDomain(selectedMonitoring.metaData.asrSpecificMetaData.domain);
    }
  }, [selectedMonitoring]);

  // Separate useEffect for fetching product categories
  useEffect(() => {
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

    fetchProductCategories();
  }, [selectedDomain]);

  return { domains, setDomains, selectedDomain, setSelectedDomain, productCategories, setProductCategories };
};
