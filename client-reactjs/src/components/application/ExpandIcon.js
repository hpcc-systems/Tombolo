import React from 'react';
import { Icon, Badge } from 'antd';

const style = {
  marginRight: 15
};

const iconStyle = {
  fontSize: 16,
  verticalAlign: 'middle',
  marginRight: 5,
  cursor: 'pointer',
  color: '#999'
};

const ExpandIconWithBadge = ({iconType, count, dot, onClick}) => (
  <Badge count={count} overflowCount={9} dot={dot}>
    <Icon type={iconType} style={iconStyle} onClick={onClick} />
  </Badge>
);

const ExpandIcon= ({expanded, ...props}) => (
  <span style={style}>
    <ExpandIconWithBadge
      style={style}
      iconType={expanded ? 'minus-square-o' : 'plus-square-o'}
      dot={expanded}
      {...props}
    />
  </span>
);

export default ExpandIcon;

