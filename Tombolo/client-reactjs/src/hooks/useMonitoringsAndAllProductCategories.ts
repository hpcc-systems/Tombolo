import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { handleError } from '@/components/common/handleResponse';
import asrService from '@/services/asr.service';
import { flattenObject } from '../components/common/CommonUtil';

interface ProductCategory {
  id: string;
  name: string;
  [key: string]: any;
}

interface UseMonitoringsAndAllProductCategoriesReturn {
  monitorings: any[];
  setMonitorings: Dispatch<SetStateAction<any[]>>;
  allProductCategories: ProductCategory[];
}

export const useMonitoringsAndAllProductCategories = (
  applicationId: string,
  getAllMonitorings: (params: { applicationId: string }) => Promise<any>,
  flatten = false
): UseMonitoringsAndAllProductCategoriesReturn => {
  const [monitorings, setMonitorings] = useState<any[]>([]);
  const [allProductCategories, setAllProductCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    // Fetch monitorings
    const fetchMonitorings = async (): Promise<void> => {
      if (!applicationId) return;
      try {
        const allMonitorings = await getAllMonitorings({ applicationId });
        if (Array.isArray(allMonitorings)) {
          if (flatten) {
            const flattenedMonitorings = allMonitorings.map(monitoring => {
              const flat = flattenObject(monitoring);
              return { ...flat, ...monitoring }; // Flat also keeps the original object - make it easier to update
            });
            setMonitorings(flattenedMonitorings);
          } else {
            setMonitorings(allMonitorings);
          }
        } else {
          setMonitorings(allMonitorings.data);
        }
      } catch (error) {
        handleError('Error fetching job monitorings');
        console.error(error);
      }
    };

    // Fetch all product categories
    const fetchAllProductCategories = async (): Promise<void> => {
      try {
        const allProducts = await asrService.getAllProductCategories();
        setAllProductCategories(allProducts);
      } catch (error) {
        handleError('Error fetching list of all products categories');
        console.error(error);
      }
    };

    fetchMonitorings();
    fetchAllProductCategories();
  }, [applicationId, flatten, getAllMonitorings]);

  return { monitorings, setMonitorings, allProductCategories };
};
