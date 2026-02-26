import { useEffect, useState } from 'react';
import { handleError } from '@/components/common/handleResponse';
import monitoringTypeService from '@/services/monitoringType.service';

interface UseMonitorTypeReturn {
  monitoringTypeId: string | null;
}

export const useMonitorType = (monitoringTypeName: string): UseMonitorTypeReturn => {
  const [monitoringTypeId, setMonitoringTypeId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch monitoring type ID
    const fetchMonitoringTypeId = async (): Promise<void> => {
      try {
        const id = await monitoringTypeService.getId({ monitoringTypeName });
        setMonitoringTypeId(id);
      } catch (error) {
        handleError('Error fetching monitoring type ID');
        console.error(error);
      }
    };

    fetchMonitoringTypeId();
  }, [monitoringTypeName]);

  return { monitoringTypeId };
};
