import { useEffect, useState } from 'react';
import { message } from 'antd';
import { getMonitoringTypeId } from '../components/common/ASRTools';

export const useMonitorType = (monitoringTypeName, setFilters) => {
  const [monitoringTypeId, setMonitoringTypeId] = useState(null);

  useEffect(() => {
    // Fetch monitoring type ID
    const fetchMonitoringTypeId = async () => {
      try {
        const id = await getMonitoringTypeId({ monitoringTypeName });
        setMonitoringTypeId(id);
      } catch (error) {
        message.error('Error fetching monitoring type ID');
      }
    };

    // Get filters from local storage
    const loadFiltersFromStorage = () => {
      const storedFilters = localStorage.getItem('jMFilters');
      if (storedFilters) {
        const parsedFilters = JSON.parse(storedFilters);
        setFilters(parsedFilters);
      }
    };

    fetchMonitoringTypeId();
    loadFiltersFromStorage();
  }, [monitoringTypeName]);

  return { monitoringTypeId };
};
