import { EditOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Divider, Space, Table, Tabs } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';
import BreadCrumbs from '../../common/BreadCrumbs';
import ConstraintDescription from './ConstraintDescription';

import ConstraintForm from './ConstraintForm';
import Propagation from './Propagation';
import RemoveContraint from './RemoveContraint';

function Constraints() {
  const [constraints, isPropagationLoading] = useSelector((state) => [
    state.applicationReducer.constraints,
    state.propagation.loading,
  ]);

  const params = useParams();

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
      <Tabs defaultActiveKey={params.tabName === 'report' ? '2' : '1'}>
        <Tabs.TabPane tab="Constraints" key="1">
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
        </Tabs.TabPane>
        <Tabs.TabPane tab={<>{isPropagationLoading ? <LoadingOutlined /> : null}Propagation </>} key="2">
          <Propagation />
        </Tabs.TabPane>
      </Tabs>
    </>
  );
}

export default Constraints;
