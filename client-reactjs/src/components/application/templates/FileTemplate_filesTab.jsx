import React, { useState } from 'react';
import { Table } from 'antd';
import useWindowSize from '../../../hooks/useWindowSize';
import Text from '../../common/Text';

function FileTemplateTable({ data }) {
  const windowSize = useWindowSize();
  const [currentPage, setCurrentPage] = useState(1);
  let pageSize = Math.abs(Math.round(windowSize.inner.height / 65));

  const columns = [
    { title: '', render: (text, record, index) => (currentPage - 1) * pageSize + index + 1 },
    { title: <Text text="Name" />, dataIndex: 'text' },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      size="small"
      rowKey={(record) => record.text}
      pagination={{
        pageSize: pageSize,
        onChange(current) {
          setCurrentPage(current);
        },
      }}
    />
  );
}

export default FileTemplateTable;
