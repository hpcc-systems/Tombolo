import { Popconfirm, message, Tooltip } from 'antd';
import React, { useState, useEffect, useRef } from 'react';

const ConfirmAction = ({
  onConfirm,
  icon,
  tooltip = null,
  notification = { success: '', error: '' },
  confirm = { title: '', okText: '', cancelText: '' },
}) => {
  const [prompt, setPrompt] = useState({ visible: false, loading: false });

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => (isMounted.current = false);
  }, []);

  const action = async () => {
    try {
      setPrompt(() => ({ visible: true, loading: true }));
      await onConfirm();
      message.success(`Success!${notification.success}`);
      isMounted.current && setPrompt(() => ({ visible: false, loading: false }));
    } catch (error) {
      console.log('Error fetch', error);
      message.error(notification.error || error.message);
      isMounted.current && setPrompt({ visible: false, loading: false });
    }
  };

  return (
    <Popconfirm
      placement="top"
      title={confirm.title}
      visible={prompt.visible}
      okText={confirm.okText || 'Yes'}
      cancelText={confirm.okText || 'No'}
      onConfirm={action}
      onCancel={() => setPrompt({ visible: false, loading: false })}
      okButtonProps={{ loading: prompt.loading }}
      cancelButtonProps={{ disabled: prompt.loading }}>
      <Tooltip title={tooltip}>
        {React.cloneElement(icon, { onClick: () => setPrompt({ visible: true, loading: false }) })}
      </Tooltip>
    </Popconfirm>
  );
};

export default ConfirmAction;
