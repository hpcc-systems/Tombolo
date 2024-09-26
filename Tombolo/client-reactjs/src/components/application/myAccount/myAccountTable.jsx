import React from 'react';
import { Table } from 'antd';

const MyAccountTable = () => {
  const columns = [
    {
      title: 'Device',
      dataIndex: 'device',
      key: 'device',
    },
    {
      title: 'Revoke',
      dataIndex: 'revoke',
      key: 'revoke',
    },
  ];

  return <Table columns={columns} />;
};

export default MyAccountTable;
