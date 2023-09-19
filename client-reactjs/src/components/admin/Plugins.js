import React, { useEffect, useState } from 'react';
import { Tooltip, Space, Table, Switch } from 'antd';
import BreadCrumbs from '../common/BreadCrumbs';
import { authHeader } from '../common/AuthHeader.js';

const Plugins = () => {
  const [plugins, setPlugins] = useState(null);
  // const getRecords = async (id) => {

  //   try {
  //     const payload = {
  //       method: 'GET',
  //       header: authHeader(),
  //     };
  //     const response = await fetch(`/api/orbit/get`, payload);

  //     console.log(response);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  const getPlugins = async () => {
    try {
      console.log(setPlugins);
      const payload = {
        method: 'POST',
        header: authHeader(),
      };
      const response = await fetch(`/api/plugins/create`, payload);

      console.log(response);
    } catch (err) {
      console.log(err);
    }
  };

  getPlugins();

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
              <Switch onChange={getPlugins(record.id)} />
            </Tooltip>
          </a>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    // getPlugins(); // TODO have this run only once when server is started. This creates all the plugins
    // getRecords();
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
