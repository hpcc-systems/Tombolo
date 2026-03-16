import React from 'react';
import { Gauge } from '@ant-design/plots';

interface Props {
  data: any;
}

const MeterGauge: React.FC<Props> = ({ data }) => {
  const gaugeColor = (maxUsage: number) => {
    if (maxUsage <= 50) return 'green';
    if (maxUsage > 50 && maxUsage < 75) return 'orange';
    if (maxUsage >= 75 && maxUsage <= 100) return 'red';
    return 'grey';
  };

  const config: any = {
    width: 300,
    height: 300,
    fill: 'black',
    data: { target: data?.maxUsage, total: 100, name: 'Usage', threshold: [data?.maxUsage, 100] },
    scale: { color: { range: [gaugeColor(data?.maxUsage), 'grey'] }, fontSize: 24, fill: 'black' },
    style: { textContent: (target: any) => `\n${target}%\n${data?.engines}`, fontSize: 24, textSize: 24 },
  };

  return (
    <>
      <Gauge {...config} />
    </>
  );
};

export default MeterGauge;
