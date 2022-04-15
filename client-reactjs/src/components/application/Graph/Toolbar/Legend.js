import React from 'react';
import { List, Typography } from 'antd';
import { HourglassOutlined, ArrowRightOutlined, SettingOutlined, EyeInvisibleOutlined, FileAddOutlined, MailOutlined} from '@ant-design/icons/lib/icons';

const { Text } = Typography;

const data = [
  {
    title: 'Incoming connection',
    icon: <ArrowRightOutlined style={{ color: '#e69495' }} />,
  },
  {
    title: 'Outgoing connection',
    icon: <ArrowRightOutlined style={{ color: '#b3eb97' }} />,
  },
  {
    title: 'Manual connection (dotted line)',
    icon: <ArrowRightOutlined style={{ color: '#47bfdd' }} />,
  },
  {
    title: 'Predecessor job connection (dashed line, created automatically when job is added to a schedule)',
    icon: <ArrowRightOutlined />,
  },
  {
    title: 'File exists in superfile (dashed line, created automatically when file is connected to superfile)',
    icon: <ArrowRightOutlined style={{ color: '#706bf0'}}  />,
  },
  {
    title: 'Time scheduled job',
    icon: <HourglassOutlined />,
  },
  {
    title: 'Job is in design',
    icon: <SettingOutlined className="Job legend-icon no-asset" />,
  },
  {
    title: 'Job is in production',
    icon: <SettingOutlined className="Job legend-icon" />,
  },
  {
    title: 'Job failed',
    icon: <SettingOutlined className="Job legend-icon status-failed" />,
  },
  {
    title: 'Job completed',
    icon: <SettingOutlined className="Job legend-icon status-completed" />,
  },
  {
    title: 'Super File',
    icon: <FileAddOutlined className="SuperFile legend-icon" />,
  },
  {
    title: 'Manual Job',
    icon: <MailOutlined className="Job legend-icon" />,
  },
  {
    title: 'Hide node (use "Hidden Nodes" tab to display them)',
    icon: <EyeInvisibleOutlined />,
  },
  {
    title: 'To zoom in/out press left "ctrl" and scroll with mouse',
    icon: <Text keyboard>ctrl</Text>,
  },
  {
    title: 'To select multiple nodes hold left "shift" + left mouse click and drag the cursor',
    icon: <Text keyboard>shift</Text>,
  },
];

const Legend = () => {
  return (
    <List
      className="graph-legend"
      size="small"
      itemLayout="horizontal"
      dataSource={data}
      renderItem={(item) => (
         <List.Item>
           <List.Item.Meta  avatar={item.icon} title={item.title} />
         </List.Item>
      )}
    />
  );
};

export default Legend;
