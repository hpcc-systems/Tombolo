import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { handleError } from '@/components/common/handleResponse';
import asrService from '@/services/asr.service';

interface DomainOption {
  label: string;
  value: string;
}

interface ProductCategoryOption {
  label: string;
  value: string;
}

interface UseDomainAndCategoriesReturn {
  domains: DomainOption[];
  setDomains: Dispatch<SetStateAction<DomainOption[]>>;
  selectedDomain: string | null;
  setSelectedDomain: Dispatch<SetStateAction<string | null>>;
  productCategories: ProductCategoryOption[];
  setProductCategories: Dispatch<SetStateAction<ProductCategoryOption[]>>;
}

export const useDomainAndCategories = (
  monitoringTypeId: string | null,
  selectedMonitoring: any
): UseDomainAndCategoriesReturn => {
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategoryOption[]>([]);

  useEffect(() => {
    // Fetch domains
    const fetchDomains = async (): Promise<void> => {
      if (!monitoringTypeId) return;
      try {
        let domainData = await asrService.getDomains({ monitoringTypeId });
        const formattedDomains = domainData.map((d: any) => ({
          label: d.name,
          value: d.id,
        }));

        setDomains(formattedDomains);
      } catch (error) {
        handleError('Error fetching domains');
        console.error(error);
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
    const fetchProductCategories = async (): Promise<void> => {
      if (!selectedDomain) return;
      try {
        const productCategories = await asrService.getProductCategories({ domainId: selectedDomain });
        const formattedProductCategories = productCategories.map((c: any) => ({
          label: `${c.shortCode} - ${c.name}`,
          value: c.id,
        }));
        setProductCategories(formattedProductCategories);
      } catch (error) {
        handleError('Error fetching product category');
        console.error(error);
      }
    };

    fetchProductCategories();
  }, [selectedDomain]);

  return { domains, setDomains, selectedDomain, setSelectedDomain, productCategories, setProductCategories };
};
