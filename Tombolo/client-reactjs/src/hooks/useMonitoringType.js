import { useEffect, useState } from 'react';
import { handleError } from '@/components/common/handleResponse';
// import { getMonitoringTypeId } from '../components/common/ASRTools';
import monitoringTypeService from '@/services/monitoringType.service';

export const useMonitorType = (monitoringTypeName) => {
  const [monitoringTypeId, setMonitoringTypeId] = useState(null);

  useEffect(() => {
    // Fetch monitoring type ID
    const fetchMonitoringTypeId = async () => {
      try {
        const id = await monitoringTypeService.getId({ monitoringTypeName });
        setMonitoringTypeId(id);
      } catch (error) {
        handleError('Error fetching monitoring type ID');
      }
    };

    fetchMonitoringTypeId();
  }, [monitoringTypeName]);

  return { monitoringTypeId };
};
