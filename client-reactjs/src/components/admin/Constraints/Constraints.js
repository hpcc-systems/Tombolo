import { EditOutlined } from '@ant-design/icons';
import { Button, Divider, Space, Table } from 'antd';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import BreadCrumbs from '../../common/BreadCrumbs';

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
      title: 'Nature',
      dataIndex: 'nature',
      sorter: (a, b) => a.nature.localeCompare(b.nature),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      sorter: (a, b) => a.source.localeCompare(b.source),
    },
    {
      title: 'Scope',
      dataIndex: 'scope',
      sorter: (a, b) => a.scope.localeCompare(b.scope),
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
        expandable={{
          expandedRowRender: (record) => {
            return (
              <>
                <ReactMarkdown source={record.description} />
                <hr />
                <p> The permissible purposes under which the constraint can be relaxed</p>
                <ul>
                  {record.permissible_purposes.split(',').map((el, index) => {
                    return <li key={index}> {el} </li>;
                  })}
                </ul>
              </>
            );
          },
        }}
      />

      <ConstraintForm modal={modal} onClose={closeModal} />
    </>
  );
}

export default Constraints;
