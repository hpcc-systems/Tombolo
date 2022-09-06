import React, { useState } from 'react';
import { Table } from 'antd';
import { useTranslation } from 'react-i18next';
import useWindowSize from '../../../hooks/useWindowSize';

function FileTemplateTable({ data }) {
  const windowSize = useWindowSize();
  const [currentPage, setCurrentPage] = useState(1);
  let pageSize = Math.abs(Math.round(windowSize.inner.height / 65));
  const { t } = useTranslation(['common']);

  const columns = [
    { title: '', render: (text, record, index) => (currentPage - 1) * pageSize + index + 1 },
    { title: t('Name', { ns: 'common' }), dataIndex: 'text' },
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
