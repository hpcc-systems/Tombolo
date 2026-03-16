import React from 'react';
import { Button } from 'antd';
import msLogo from '../../images/mslogo.png';
import { azureLoginRedirect } from '@/redux/slices/AuthSlice';

type Props = {
  size?: any;
  className?: string;
  style?: any;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
};

const AzureLoginButton: React.FC<Props> = ({
  size = 'large',
  className = 'fullWidth',
  style = { background: 'black', color: 'white' },
  onClick,
  disabled = false,
  label = 'Continue',
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      azureLoginRedirect();
    }
  };

  return (
    <Button size={size} style={style} className={className} onClick={handleClick} disabled={disabled}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <img src={msLogo} style={{ height: '1.5rem', width: 'auto' }} />
        <span>{label}</span>
      </div>
    </Button>
  );
};

export default AzureLoginButton;
