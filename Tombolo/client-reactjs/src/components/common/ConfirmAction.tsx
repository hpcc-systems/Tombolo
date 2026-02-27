import { Popconfirm, Tooltip } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { handleSuccess, handleError } from './handleResponse';

type Notification = { success?: string; error?: string };
type Confirm = { title?: string; okText?: string; cancelText?: string };

type Props = {
  onConfirm: () => Promise<any> | any;
  icon: React.ReactElement;
  tooltip?: React.ReactNode | null;
  notification?: Notification;
  confirm?: Confirm;
};

const ConfirmAction: React.FC<Props> = ({
  onConfirm,
  icon,
  tooltip = null,
  notification = { success: '', error: '' },
  confirm = { title: '', okText: '', cancelText: '' },
}) => {
  const [prompt, setPrompt] = useState<{ visible: boolean; loading: boolean }>({ visible: false, loading: false });

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const action = async () => {
    try {
      setPrompt(() => ({ visible: true, loading: true }));
      await onConfirm();
      handleSuccess(`Success!${notification?.success || ''}`);
      if (isMounted.current) setPrompt(() => ({ visible: false, loading: false }));
    } catch (error: any) {
      console.error('Error fetch', error);
      handleError(notification?.error || error?.message || '');
      if (isMounted.current) setPrompt({ visible: false, loading: false });
    }
  };

  return (
    <Popconfirm
      placement="top"
      title={confirm?.title}
      open={prompt.visible}
      okText={confirm?.okText || 'Yes'}
      cancelText={confirm?.okText || 'No'}
      onConfirm={action}
      onCancel={() => setPrompt({ visible: false, loading: false })}
      okButtonProps={{ loading: prompt.loading }}
      cancelButtonProps={{ disabled: prompt.loading }}>
      <Tooltip title={tooltip}>
        {React.cloneElement(icon as any, { onClick: () => setPrompt({ visible: true, loading: false }) } as any)}
      </Tooltip>
    </Popconfirm>
  );
};

export default ConfirmAction;
