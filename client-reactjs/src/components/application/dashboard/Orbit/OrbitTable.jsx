/* eslint-disable unused-imports/no-unused-vars */
import React from 'react';
import { Table } from 'antd';

function OrbitTable({ filteredWorkUnits, filteredBuilds, loading }) {
  //Table columns and data
  const columns = [
    {
      title: 'Product',
      render: (record) => {
        return record.product?.toUpperCase();
      },
      width: 225,
    },
    { title: 'Orbit Build Name', dataIndex: 'build' },
    {
      title: 'WUs',
      render: (record) => {
        return record?.count ? record.count : 0;
      },
      sorter: (a, b) => a.count - b.count,

      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'descend',
      width: 75,
    },
  ];

  const wuColumns = [
    { title: 'Build WUID', dataIndex: 'wuid', width: 75 },
    { title: 'Version', dataIndex: 'version', width: 75 },
    { title: 'Initial Status', dataIndex: 'initialStatus', width: 100 },
    { title: 'Final Status', dataIndex: 'finalStatus', width: 150 },
    { title: 'Build Owner', dataIndex: 'primaryContact', width: 150 },
  ];

  //JSX
  return (
    <>
      <div style={{ width: '45%', float: 'left' }} className="OrbitTable">
        <div style={{ border: '1px solid #d9d9d9', padding: '.25rem' }}>
          <Table
            align="right"
            size="small"
            columns={columns}
            dataSource={filteredBuilds}
            rowKey={(record) => record.name}
            verticalAlign="top"
            loading={loading}
            pagination={false}
            headerColor="white"
            headerBg="#001529"
            scroll={{ y: 400 }}
          />
        </div>
        <br />
        <div style={{ border: '1px solid #d9d9d9', padding: '.25rem' }}>
          <Table
            align="right"
            size="small"
            columns={wuColumns}
            dataSource={filteredWorkUnits}
            rowKey={(record) => record.key}
            verticalAlign="top"
            loading={loading}
            headerColor="white"
            headerBg="#001529"
            scroll={{ x: 1300, y: 400 }}
            pagination={false}
          />
        </div>
      </div>
    </>
  );
}

export default OrbitTable;
