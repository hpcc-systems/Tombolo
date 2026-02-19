import React, { useEffect } from 'react';
import { Table, Space, Tooltip, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { handleSuccess, handleError as handleResponseError } from '@/components/common/handleResponse';
import apiKeysService from '@/services/apiKeys.service';

interface Props {
  keys: any[] | null;
  getKeys: () => Promise<any>;
  active?: number;
  applicationId?: any;
  showDrawer?: () => void;
}

const DashboardApiTable: React.FC<Props> = ({ keys, getKeys, active = 1 }) => {
  const { Text } = Typography;

  const deleteKey = async (id: any) => {
    try {
      await apiKeysService.delete(id);
      await getKeys();
      handleSuccess('Key Deleted');
      return;
    } catch (error) {
      handleResponseError('Failed to Delete key');
    }
  };

  useEffect(() => {
    getKeys();
  }, []);

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Created', dataIndex: 'formattedCreatedAt' },
    {
      title: 'Expires in',
      dataIndex: 'daysToExpire',
      render: (_: any, record: any) => {
        return <>{record.expired ? <Text type="danger">Expired</Text> : <Text>{record.daysToExpire}</Text>}</>;
      },
    },
    {
      title: 'Expired',
      dataIndex: 'expired',
      key: 'expired',
      filters: [
        { text: '0', value: 0 },
        { text: '1', value: 1 },
      ],
      onFilter: (value: any, record: any) => (record.expired === value) === false,
      defaultFilteredValue: [active],
      filterIcon: (filtered: any) => <div>{filtered}</div>,
      render: (_: any, record: any) => <>{record.expired ? <Text>Yes</Text> : <Text>No</Text>}</>,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          <a>
            <Tooltip title="Delete Key">
              <DeleteOutlined
                onClick={() => {
                  deleteKey(record.id);
                }}
              />
            </Tooltip>
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        size="small"
        style={{ marginTop: '1rem' }}
        columns={columns}
        dataSource={keys || []}
        rowKey={(record: any) => record.id}
        pagination={false}
        expandable={{
          expandedRowRender: (record: any) => (
            <p style={{ marginLeft: '3rem' }}>
              Expiration Date: {record.expirationDate}
              <br />
              Notes: {record.Notes ? <>{record.Notes}</> : <>No Notes Found</>}
            </p>
          ),
        }}
      />
    </>
  );
};

export default DashboardApiTable;
