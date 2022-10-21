import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { useSelector } from 'react-redux';

import { authHeader, handleError } from '../../common/AuthHeader.js';
import Text from '../../common/Text.jsx';

function DataflowAssetsTable() {
  const [dataflowAssets, setDataflowAssets] = useState([]);
  const [dataflowId, applicationId] = useSelector((state) => [
    state.dataflowReducer?.id,
    state.applicationReducer?.application?.applicationId,
  ]);

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
      title: <Text text="Name" />,
      dataIndex: 'name',
      width: '30%',
      ellipsis: true,
    },
    {
      title: <Text text="Description" />,
      dataIndex: 'description',
      width: '30%',
    },
    {
      title: <Text text="Created" />,
      dataIndex: 'createdAt',
      width: '20%',
    },
    {
      title: <Text text="Owner" />,
      dataIndex: 'contact',
      width: '20%',
    },
    {
      title: <Text text="Type" />,
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
