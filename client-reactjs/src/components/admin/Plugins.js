import React from 'react';
import { Tooltip, Space, Table, Switch } from 'antd';
import BreadCrumbs from '../common/BreadCrumbs';

const Plugins = () => {
  const plugins = [
    {
      id: 1,
      name: 'Orbit',
      description:
        'Enabling this plugin will allow Tombolo to provide a dashboard with data collected from HPCCs Orbit system and provide dashboard information for it',
    },
  ];

  const onChange = (id) => console.log(id);
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
              <Switch defaultChecked onChange={onChange(record.id)} />
            </Tooltip>
          </a>
        </Space>
      ),
    },
  ];
  return (
    <>
      <BreadCrumbs />
      <br />
      <Table size="small" columns={columns} dataSource={plugins} rowKey={(record) => record.id} />
    </>
  );
};

export default Plugins;
