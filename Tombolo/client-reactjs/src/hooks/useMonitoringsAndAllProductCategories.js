import { useEffect, useState } from 'react';
import { message } from 'antd';
import { getAllProductCategories } from '../components/common/ASRTools';

export const useMonitoringsAndAllProductCategories = (applicationId, getAllMonitorings) => {
  const [monitorings, setMonitorings] = useState([]);
  const [allProductCategories, setAllProductCategories] = useState([]);

  useEffect(() => {
    // Fetch monitorings
    const fetchMonitorings = async () => {
      if (!applicationId) return;
      try {
        const allMonitorings = await getAllMonitorings({ applicationId });
        setMonitorings(allMonitorings);
      } catch (error) {
        message.error('Error fetching job monitorings');
      }
    };

    // Fetch all product categories
    const fetchAllProductCategories = async () => {
      try {
        const allProducts = await getAllProductCategories();
        setAllProductCategories(allProducts);
      } catch (error) {
        message.error('Error fetching list of all products categories');
      }
    };

    fetchMonitorings();
    fetchAllProductCategories();
  }, [applicationId]);

  return { monitorings, setMonitorings, allProductCategories };
};
