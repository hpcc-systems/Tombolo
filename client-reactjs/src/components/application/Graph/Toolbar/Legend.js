import React from 'react';
import { List, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
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

const { Text } = Typography;

const Legend = () => {
  const { t } = useTranslation(['common']);
  const data = [
    {
      title: t('Incoming connection', { ns: 'common' }),
      icon: <ArrowRightOutlined style={{ color: colors.inputArrow }} />,
    },
    {
      title: t('Outgoing connection', { ns: 'common' }),
      icon: <ArrowRightOutlined style={{ color: colors.outputArrow }} />,
    },
    {
      title: t('Manual connection (dotted line)', { ns: 'common' }),
      icon: <ArrowRightOutlined style={{ color: colors.manualArrow }} />,
    },
    {
      title: t('Predecessor job connection (dashed line, created automatically when job is added to a schedule)', {
        ns: 'common',
      }),
      icon: <ArrowRightOutlined />,
    },
    {
      title: t('File exists in superfile (dashed line, created automatically when file is connected to superfile)', {
        ns: 'common',
      }),
      icon: <ArrowRightOutlined style={{ color: colors.superFileArrow }} />,
    },
    {
      title: t('Time scheduled job', { ns: 'common' }),
      icon: <HourglassOutlined />,
    },
    {
      title: t('Job is in design', { ns: 'common' }),
      icon: <SettingOutlined className="Job legend-icon no-asset" />,
    },
    {
      title: t('Job is in production', { ns: 'common' }),
      icon: <SettingOutlined className="Job legend-icon" />,
    },
    {
      title: t('Job failed', { ns: 'common' }),
      icon: <SettingOutlined className="Job legend-icon status-failed" />,
    },
    {
      title: t('Job completed', { ns: 'common' }),
      icon: <SettingOutlined className="Job legend-icon status-completed" />,
    },
    {
      title: t('File template', { ns: 'common' }),
      icon: <ProfileOutlined className="FileTemplate legend-icon" />,
    },
    {
      title: t('Super File', { ns: 'common' }),
      icon: <FileAddOutlined className="SuperFile legend-icon" />,
    },
    {
      title: t('Manual Job', { ns: 'common' }),
      icon: <MailOutlined className="Job legend-icon" />,
    },
    {
      title: t('Query Publish Job', { ns: 'common' }),
      icon: <SoundOutlined className="Job legend-icon" />,
    },
    {
      title: t("Hide node (use 'Hidden Nodes' tab to display them)", { ns: 'common' }),
      icon: <EyeInvisibleOutlined />,
    },
    {
      title: t("To zoom in/out press left 'ctrl' and scroll with mouse", { ns: 'common' }),
      icon: <Text keyboard>ctrl</Text>,
    },
    {
      title: t("To select multiple nodes hold left 'shift' + left mouse click and drag the cursor", { ns: 'common' }),
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
