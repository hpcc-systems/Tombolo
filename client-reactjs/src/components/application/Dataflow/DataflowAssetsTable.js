import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { useSelector } from 'react-redux';

function DataflowAssetsTable() {
  const [dataflowAssets, setDataflowAssets] = useState([]);
  const dataflowReducer = useSelector((state) => state.dataflowReducer);
  const { dataflowId, applicationId } = dataflowReducer;

  const fetchDataAndRenderTable = async () => {
    try {
      const response = await fetch(`/api/dataflow/assets?app_id=${applicationId}&dataflowId=${dataflowId}`, {
        headers: authHeader(),
      });
      if (!response.ok) handleError(response);
      const data = await response.json();
      setDataflowAssets(data);
    } catch (error) {
      console.log('------------------------------------------');
      console.log('error', error);
    }
  };

  useEffect(() => {
    if (applicationId && dataflowId) {
      fetchDataAndRenderTable();
    }
  }, [dataflowId, applicationId]);

  const jobColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      width: '30%',
      ellipsis: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: '30%',
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      width: '20%',
    },
    {
      title: 'Owner',
      dataIndex: 'contact',
      width: '20%',
    },
    {
      title: 'Type',
      dataIndex: 'objType',
      width: '15%',
    },
  ];

  return (
    <React.Fragment>
      <div style={{ height: '85%' }}>
        <Table
          columns={jobColumns}
          rowKey={(record) => record.id}
          dataSource={dataflowAssets}
          pagination={dataflowAssets?.length > 10 ? { pageSize: 10 } : false}
          scroll={{ y: 660 }}
        />
      </div>
    </React.Fragment>
  );
}
export default DataflowAssetsTable;
