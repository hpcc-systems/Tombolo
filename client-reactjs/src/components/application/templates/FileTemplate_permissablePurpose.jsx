import React from 'react';
import { Table } from 'antd';

//Table columns
const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    render: (text, record) => (
      <a href={record.url} target="_blank" rel="noreferrer">
        {record.name}
      </a>
    ),
    width: '20%',
  },
  {
    title: 'Description',
    dataIndex: 'description',
  },
];

function FileTemplate_permissablePurpose(props) {
  const { enableEdit, editingAllowed, setSelectedLicenses, selectedLicenses, licenses } = props;

  //When row is selected or deselected
  let rowSelection = {
    selectedRowKeys: selectedLicenses.map((license) => license.id),
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedLicenses(selectedRows);
    },
    getCheckboxProps: (_record) => ({
      disabled: !editingAllowed || !enableEdit,
    }),
  };

  //JSX
  return (
    <Table
      columns={columns}
      dataSource={licenses}
      size={'small'}
      rowSelection={{
        type: 'checkbox',
        defaultSelectedRowKeys: selectedLicenses.map((license) => license.id),
        ...rowSelection,
      }}
      rowKey={(record) => record.id}
      pagination={false}
      bordered={true}
    />
  );
}

export default FileTemplate_permissablePurpose;
