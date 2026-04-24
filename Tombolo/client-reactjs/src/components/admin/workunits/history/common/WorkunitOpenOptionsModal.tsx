import React, { useState } from 'react';
import { Popconfirm, ConfigProvider } from 'antd';
import styles from '../workunitHistory.module.css';

interface WorkunitOpenOptionsModalProps {
  wuId?: string;
  hasEclWatchLink: boolean;
  onOpenTombolo: () => void;
  onOpenEclWatch: () => void;
  children: React.ReactNode;
}

const WorkunitOpenOptionsModal: React.FC<WorkunitOpenOptionsModalProps> = ({
  hasEclWatchLink,
  onOpenTombolo,
  onOpenEclWatch,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const handleOpenTombolo = () => {
    setOpen(false);
    onOpenTombolo();
  };

  const handleOpenEclWatch = () => {
    setOpen(false);
    onOpenEclWatch();
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
      <Popconfirm
        open={open}
        onOpenChange={setOpen}
        trigger="click"
        placement="bottomLeft"
        icon={null}
        title={<span className={styles.workunitOpenTitle}>Open Workunit details in</span>}
        okText="Tombolo"
        cancelText="ECL Watch"
        onConfirm={handleOpenTombolo}
        onCancel={handleOpenEclWatch}
        okButtonProps={{
          className: styles.workunitOpenBtn,
        }}
        cancelButtonProps={{
          type: 'primary',
          ghost: true,
          disabled: !hasEclWatchLink,
          className: styles.workunitOpenBtn,
        }}>
        <span
          onClick={event => {
            event.stopPropagation();
          }}>
          {children}
        </span>
      </Popconfirm>
    </ConfigProvider>
  );
};

export default WorkunitOpenOptionsModal;
