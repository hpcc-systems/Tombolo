import React from 'react';
import { Typography } from 'antd';

const ReadOnlyField = ({ value, children, ...rest }) => (
  <Typography.Text {...rest} className="ant-form-text">
    {value || children}
  </Typography.Text>
);

export default ReadOnlyField;
