import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Empty, Select } from 'antd';
import { addQueriesToUrl } from '../../../../common/AddQueryToUrl';
import MeterGauge from './MeterGauge';
import styles from '../clusterUsage.module.css';
import clusterService from '@/services/cluster.service';
import { handleError } from '@/components/common/handleResponse';

const { Option } = Select as any;

interface Props {
  selectedCluster: any;
  setSelectedCluster: (v: any) => void;
  setActiveTab?: (v: any) => void;
}

const CurrentClusterUsageCharts: React.FC<Props> = ({ selectedCluster, setSelectedCluster }) => {
  const [currentUsage, setCurrentUsage] = useState<any[]>([]);
  const clusters = useSelector((state: any) => state.application.clusters);

  useEffect(() => {
    if (selectedCluster) getCurrentClusterUsage(selectedCluster);
  }, [selectedCluster]);

  const getCurrentClusterUsage = async (clusterId: any) => {
    try {
      const data = await clusterService.getCurrentClusterUsage(clusterId);
      const groupedUsage: any[] = [];
      const groupedData: any = {};

      data.forEach((d: any) => {
        const key = d.maxUsage + 'x' + d.meanUsage;
        if (groupedData[key]) {
          const newEngineList = [...groupedData[key].engines, d.name];
          groupedData[key] = { ...groupedData[key], engines: newEngineList };
        } else {
          groupedData[key] = { data: { maxUsage: d.maxUsage, meanUsage: d.meanUsage }, engines: [d.name] };
        }
      });

      if (Object.keys(groupedData).length > 0) {
        for (const key in groupedData)
          groupedUsage.push({ data: groupedData[key].data, engines: groupedData[key].engines });
      }

      setCurrentUsage(groupedUsage);
    } catch (err) {
      setCurrentUsage([]);
      handleError(err);
    }
  };

  const handleClusterChange = (value: any) => {
    addQueriesToUrl({ queryName: 'clusterId', queryValue: value });
    setSelectedCluster(value);
  };

  return (
    <div className={styles.currentClusterUsageCharts_container}>
      <div>
        {clusters ? (
          <Select
            disabled={false}
            onChange={handleClusterChange}
            value={selectedCluster}
            className={styles.currentClusterUsageCharts_clusterSelector}>
            {clusters.map((cluster: any) => (
              <Option key={cluster.id} label={cluster.name} value={cluster.id}>
                {cluster.name}
              </Option>
            ))}
          </Select>
        ) : null}
      </div>
      <div className={styles.currentClusterUsageCharts_main}>
        {currentUsage.length < 1 ? (
          <div className={styles.currentClusterUsageCharts_empty}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div
            className={
              currentUsage.length < 5
                ? styles.currentClusterUsageCharts_meterGauges_5orLess
                : styles.currentClusterUsageCharts_meterGauges_5orMore
            }>
            {currentUsage.map(current => (
              <div className={styles.currentClusterUsageCharts_meterGaugeBox} key={current.engines[0]}>
                <MeterGauge data={{ ...current.data, name: current.engines[0], engines: current.engines }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentClusterUsageCharts;
