import React from 'react';
import { Typography } from 'antd';

const ReadOnlyField = ({ value, children, ...rest }) => (
  <Typography.Text {...rest} style={{ paddingLeft: '11px' }} className="ant-form-text">
    {value || children}
  </Typography.Text>
);

export default ReadOnlyField;
