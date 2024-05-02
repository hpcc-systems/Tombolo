import React from 'react';
import { List } from 'antd';
import {
  HourglassOutlined,
  ProfileOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  EyeInvisibleOutlined,
  FileAddOutlined,
  MailOutlined,
  SoundOutlined,
} from '@ant-design/icons/lib/icons';
import { colors } from '../graphColorsConfig';
import Text from '../../../common/Text';

const Legend = () => {
  const data = [
    {
      title: <Text text="Incoming connection" />,
      icon: <ArrowRightOutlined style={{ color: colors.inputArrow }} />,
    },
    {
      title: <Text text="Outgoing connection" />,
      icon: <ArrowRightOutlined style={{ color: colors.outputArrow }} />,
    },
    {
      title: <Text text="Manual connection (dotted line)" />,
      icon: <ArrowRightOutlined style={{ color: colors.manualArrow }} />,
    },
    {
      title: (
        <Text text="Predecessor job connection (dashed line, created automatically when job is added to a schedule)" />
      ),
      icon: <ArrowRightOutlined />,
    },
    {
      title: (
        <Text text="File exists in superfile (dashed line, created automatically when file is connected to superfile)" />
      ),
      icon: <ArrowRightOutlined style={{ color: colors.superFileArrow }} />,
    },
    {
      title: <Text text="Time scheduled job" />,
      icon: <HourglassOutlined />,
    },
    {
      title: <Text text="Job is in design" />,
      icon: <SettingOutlined className="Job legend-icon no-asset" />,
    },
    {
      title: <Text text="Job is in production" />,
      icon: <SettingOutlined className="Job legend-icon" />,
    },
    {
      title: <Text text="Job failed" />,
      icon: <SettingOutlined className="Job legend-icon status-failed" />,
    },
    {
      title: <Text text="Job completed" />,
      icon: <SettingOutlined className="Job legend-icon status-completed" />,
    },
    {
      title: <Text text="File template" />,
      icon: <ProfileOutlined className="FileTemplate legend-icon" />,
    },
    {
      title: <Text text="Super File" />,
      icon: <FileAddOutlined className="SuperFile legend-icon" />,
    },
    {
      title: <Text text="Manual Job" />,
      icon: <MailOutlined className="Job legend-icon" />,
    },
    {
      title: <Text text="Query Publish Job" />,
      icon: <SoundOutlined className="Job legend-icon" />,
    },
    {
      title: <Text text="Hide node (use 'Hidden Nodes' tab to display them)" />,
      icon: <EyeInvisibleOutlined />,
    },
    {
      title: <Text text="To zoom in/out press left 'ctrl' and scroll with mouse" />,
      icon: <Text keyboard>ctrl</Text>,
    },
    {
      title: <Text text="To select multiple nodes hold left 'shift' + left mouse click and drag the cursor" />,
      icon: <Text keyboard>shift</Text>,
    },
  ];
  return (
    <List
      className="graph-legend"
      size="small"
      itemLayout="horizontal"
      dataSource={data}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta avatar={item.icon} title={item.title} />
        </List.Item>
      )}
    />
  );
};

export default Legend;
