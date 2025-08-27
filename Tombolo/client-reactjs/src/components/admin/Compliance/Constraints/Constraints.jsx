import { EditOutlined } from '@ant-design/icons';
import { Button, Divider, Space, Table } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Text from '../../../common/Text';
import ConstraintDescription from './ConstraintDescription';

import ConstraintForm from './ConstraintForm';
import RemoveContraint from './RemoveContraint';

function Constraints() {
  const constraints = useSelector((state) => state.application.constraints);

  const [modal, setModal] = useState({ isOpen: false, constraint: null });

  const add = () => setModal(() => ({ isOpen: true, constraint: null }));
  const edit = (record) => setModal(() => ({ isOpen: true, constraint: record }));
  const closeModal = () => setModal(() => ({ isOpen: false, constraint: null }));

  const columns = [
    {
      title: <Text>Name</Text>,
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: <Text>Description</Text>,
      dataIndex: 'short_description',
      elipsis: true,
    },
    {
      title: <Text>Action</Text>,
      key: 'x',
      render: (record) => (
        <Space split={<Divider type="vertical" />}>
          <EditOutlined onClick={() => edit(record)} />
          <RemoveContraint record={record} />
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={add} type="primary">
          <Text>Add new constraint</Text>
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={constraints}
        rowKey={(record) => record.id}
        expandable={{ expandedRowRender: (record) => <ConstraintDescription record={record} /> }}
      />
      <ConstraintForm modal={modal} onClose={closeModal} />
    </>
  );
}

export default Constraints;
