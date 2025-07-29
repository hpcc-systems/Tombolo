import { useEffect, useState } from 'react';
import { message } from 'antd';
import { getMonitoringTypeId } from '../components/common/ASRTools';

export const useMonitorType = (monitoringTypeName) => {
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

    fetchMonitoringTypeId();
  }, [monitoringTypeName]);

  return { monitoringTypeId };
};
