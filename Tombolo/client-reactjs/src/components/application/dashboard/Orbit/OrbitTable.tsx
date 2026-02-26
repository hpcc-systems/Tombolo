import React from 'react';
import { Table } from 'antd';
import styles from './orbit.module.css';

interface Props {
  filteredWorkUnits: any[] | null;
  filteredBuilds: any[] | null;
  loading: boolean;
}

const OrbitTable: React.FC<Props> = ({ filteredWorkUnits, filteredBuilds, loading }) => {
  const columns = [
    {
      title: 'Product',
      render: (record: any) => record.product?.toUpperCase(),
      width: 225,
    },
    { title: 'Orbit Build Name', dataIndex: 'build' },
    {
      title: 'WUs',
      render: (record: any) => (record?.count ? record.count : 0),
      sorter: (a: any, b: any) => a.count - b.count,
      sortDirections: ['ascend' as any, 'descend' as any],
      defaultSortOrder: 'descend' as any,
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

  return (
    <>
      <div style={{ width: '45%', float: 'left' }} className={styles.OrbitTable}>
        <div style={{ border: '1px solid #d9d9d9', padding: '.25rem' }}>
          <Table
            size="small"
            columns={columns}
            dataSource={filteredBuilds || []}
            rowKey={(record: any) => record.name}
            loading={loading}
            pagination={false}
            scroll={{ y: 400 }}
          />
        </div>
        <br />
        <div style={{ border: '1px solid #d9d9d9', padding: '.25rem' }}>
          <Table
            size="small"
            columns={wuColumns}
            dataSource={filteredWorkUnits || []}
            rowKey={(record: any) => record.key}
            loading={loading}
            scroll={{ x: 1300, y: 400 }}
            pagination={false}
          />
        </div>
      </div>
    </>
  );
};

export default OrbitTable;
