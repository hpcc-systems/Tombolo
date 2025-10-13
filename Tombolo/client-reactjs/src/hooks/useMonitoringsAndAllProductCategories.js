import { useEffect, useState } from 'react';
import { handleError } from '@/components/common/handleResponse';
// import { getAllProductCategories } from '../components/common/ASRTools';
import asrService from '@/services/asr.service';
import { flattenObject } from '../components/common/CommonUtil';

export const useMonitoringsAndAllProductCategories = (applicationId, getAllMonitorings, flatten = false) => {
  const [monitorings, setMonitorings] = useState([]);
  const [allProductCategories, setAllProductCategories] = useState([]);

  useEffect(() => {
    // Fetch monitorings
    const fetchMonitorings = async () => {
      if (!applicationId) return;
      try {
        const allMonitorings = await getAllMonitorings({ applicationId });
        if (Array.isArray(allMonitorings)) {
          if (flatten) {
            const flattenedMonitorings = allMonitorings.map((monitoring) => {
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
      }
    };

    // Fetch all product categories
    const fetchAllProductCategories = async () => {
      try {
        const allProducts = await asrService.getAllProductCategories();
        setAllProductCategories(allProducts);
      } catch (error) {
        handleError('Error fetching list of all products categories');
      }
    };

    fetchMonitorings();
    fetchAllProductCategories();
  }, [applicationId, flatten, getAllMonitorings]);

  return { monitorings, setMonitorings, allProductCategories };
};
