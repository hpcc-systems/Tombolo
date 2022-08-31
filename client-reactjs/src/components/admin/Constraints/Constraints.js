/* eslint-disable unused-imports/no-unused-imports */
import { DeleteOutlined, EditOutlined, FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Divider, List, Popconfirm, Row, Space, Table, Tabs, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import { propagationActions } from '../../../redux/actions/Propagation';
import BreadCrumbs from '../../common/BreadCrumbs';
import ConstraintDescription from './ConstraintDescription';

import ConstraintForm from './ConstraintForm';
import ConstraintsTags from './ConstraintsTags';
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

const Propagation = () => {
  const dispatch = useDispatch();
  const propagation = useSelector((state) => state.propagation);

  const history = useHistory();

  const handlePropagate = () => dispatch(propagationActions.propagate({ history }));

  const removeReport = (report) => {
    const newReports = propagation.reports.filter((el) => el.id !== report.id);
    dispatch(propagationActions.updateReports(newReports));
    localStorage.setItem('reports', JSON.stringify(newReports));
  };

  useEffect(() => {
    if (propagation.reports.length === 0) {
      const reports = JSON.parse(localStorage.getItem('reports'));
      if (reports) {
        dispatch(propagationActions.updateReports(reports));
      }
    }
  }, []);

  const columns = [
    {
      title: 'Reports',
      dataIndex: 'timeStamp',
      sorter: (a, b) => new Date(b.timeStamp) - new Date(a.timeStamp),
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Action',
      key: 'x',
      render: (record) => (
        <Space split={<Divider type="vertical" />}>
          <Popconfirm
            placement="top"
            title={'Are you sure you want to delete this report?'}
            onConfirm={() => removeReport(record)}
            okText="Yes"
            cancelText="No">
            <DeleteOutlined />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ maxWidth: '500px', marginBottom: '15px' }}>
        {propagation.error ? (
          <Alert style={{ margin: '10px 0' }} type="error" showIcon message={propagation.error} />
        ) : null}

        <Alert
          message="Fields constraints propagation"
          description="Constraints added to the input files fields will be passed to the output files fields. This process will take some time!"
          showIcon
          action={
            <Button key="propagate" loading={propagation.loading} type="primary" block onClick={handlePropagate}>
              Propagate
            </Button>
          }
        />
      </div>

      <Table
        columns={columns}
        dataSource={propagation.reports}
        size="small"
        pagination={false}
        rowKey={(record) => record.id}
        expandable={{
          expandedRowRender: (record) => {
            console.log('record :>> ', record);

            const columns = [
              {
                title: 'Field',
                dataIndex: 'name',
                width: '20%',
                sorter: (a, b) => a.name.localeCompare(b.name),
              },
              {
                title: 'Current Constraints',
                children: [
                  {
                    title: 'Own',
                    dataIndex: 'own',
                    key: 'id',
                    width: '20%',
                    render: (text, record) => {
                      return <ConstraintsTags list={record.own} />;
                    },
                  },
                  {
                    title: 'Inherited',
                    dataIndex: 'inherited',
                    width: '20%',
                    key: 'id',
                    render: (text, record) => {
                      return <ConstraintsTags list={record.inherited} />;
                    },
                  },
                ],
              },
              {
                title: 'Changes Made',
                children: [
                  {
                    title: 'Added',
                    dataIndex: 'added',
                    width: '20%',
                    key: 'id',
                    render: (text, record) => {
                      return <ConstraintsTags list={record.added} />;
                    },
                  },
                  {
                    title: 'Removed',
                    dataIndex: 'removed',
                    key: 'id',
                    width: '20%',
                    render: (text, record) => {
                      return <ConstraintsTags list={record.removed} />;
                    },
                  },
                ],
              },
            ];

            return record.report.map((file) => {
              return (
                <>
                  <Table
                    bordered
                    size="small"
                    style={{ marginBottom: '10px' }}
                    key={file.id}
                    columns={columns}
                    pagination={false}
                    dataSource={file.fields}
                    rowKey={(field) => field.name}
                    title={() => (
                      <Space>
                        <FileTextOutlined /> <Typography> {file.name} </Typography>
                      </Space>
                    )}
                  />
                  <hr />
                </>
              );
            });
          },
        }}
      />
    </>
  );
};
