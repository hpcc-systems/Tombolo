import { EditOutlined } from '@ant-design/icons';
import { Button, Divider, Space, Table } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import BreadCrumbs from '../../../common/BreadCrumbs';
import ConstraintDescription from './ConstraintDescription';

import ConstraintForm from './ConstraintForm';
import RemoveContraint from './RemoveContraint';

function Constraints() {
  const constraints = useSelector((state) => state.applicationReducer.constraints);

  const [modal, setModal] = useState({ isOpen: false, constraint: null });

  const add = () => setModal(() => ({ isOpen: true, constraint: null }));
  const edit = (record) => setModal(() => ({ isOpen: true, constraint: record }));
  const closeModal = () => setModal(() => ({ isOpen: false, constraint: null }));

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Short Description',
      dataIndex: 'short_description',
      elipsis: true,
    },
    {
      title: 'Action',
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
      <BreadCrumbs
        extraContent={
          <Button onClick={add} type="primary">
            Add new contraint
          </Button>
        }
      />
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
