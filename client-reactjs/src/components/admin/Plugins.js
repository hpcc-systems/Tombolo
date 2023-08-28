import React, { useEffect } from 'react';
import { Tooltip, Space, Table, Switch } from 'antd';
import BreadCrumbs from '../common/BreadCrumbs';
import { authHeader } from '../common/AuthHeader.js';

const Plugins = () => {
  const plugins = [
    {
      id: 1,
      name: 'Orbit',
      description:
        'Enabling this plugin will allow Tombolo to provide a dashboard with data collected from HPCCs Orbit system and provide dashboard information for it',
    },
  ];

  const getRecords = async (id) => {
    console.log(id);
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };
      const response = await fetch(`/api/orbit/get`, payload);

      console.log(response);
    } catch (err) {
      console.log(err);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Description', dataIndex: 'description' },
    {
      title: 'Activate',
      dataIndex: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <a>
            <Tooltip title="Active">
              <Switch onChange={getRecords(record.id)} />
            </Tooltip>
          </a>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    getRecords(1);
  });
  return (
    <>
      <BreadCrumbs />
      <br />
      <Table size="small" columns={columns} dataSource={plugins} rowKey={(record) => record.id} />
    </>
  );
};

export default Plugins;
