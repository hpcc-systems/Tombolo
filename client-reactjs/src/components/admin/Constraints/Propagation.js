import React, { useEffect, useState } from 'react';
import { DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, message, Popconfirm, Space, Table, Typography } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { propagationActions } from '../../../redux/actions/Propagation';

import ConstraintsTags from './ConstraintsTags';
import { authHeader } from '../../common/AuthHeader';

const Propagation = () => {
  const dispatch = useDispatch();
  const propagation = useSelector((state) => state.propagation);

  const history = useHistory();

  const handlePropagate = () => dispatch(propagationActions.propagate({ history }));

  useEffect(() => {
    if (propagation.reports.length === 0) {
      dispatch(propagationActions.getReports());
    }
  }, []);

  const columns = [
    {
      title: 'Reports',
      dataIndex: 'createdAt',
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Action',
      key: 'x',
      render: (record) => (
        <Space split={<Divider type="vertical" />}>
          <DeleteReport report={record} />
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
        size="small"
        columns={columns}
        pagination={false}
        loading={propagation.loading}
        rowKey={(record) => record.id}
        dataSource={propagation.reports}
        expandable={{
          expandedRowRender: (record) => {
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

export default Propagation;

const DeleteReport = ({ report }) => {
  const dispatch = useDispatch();
  const propagation = useSelector((state) => state.propagation);
  const [prompt, setPrompt] = useState({ visible: false, loading: false });

  const removeReport = async () => {
    try {
      const config = {
        method: 'DELETE',
        headers: authHeader(),
      };

      setPrompt(() => ({ visible: true, loading: true }));

      const response = await fetch(`/api/report/read/${report.id}`, config);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      if (!data.id) throw new Error('Failed to remove report!');

      const newReports = propagation.reports.filter((el) => el.id !== data.id);
      dispatch(propagationActions.updateReports(newReports));

      setPrompt(() => ({ visible: false, loading: false }));
      message.success('Success, report has been deleted!');
    } catch (error) {
      console.log('Error fetch', error);
      message.error(error.message);
      setPrompt({ visible: false, loading: false });
    }
  };

  return (
    <Popconfirm
      placement="top"
      title={'Are you sure you want to delete this report?'}
      visible={prompt.visible}
      okText="Yes"
      cancelText="No"
      onConfirm={removeReport}
      onCancel={() => setPrompt({ visible: false, loading: false })}
      okButtonProps={{ loading: prompt.loading }}
      cancelButtonProps={{ disabled: prompt.loading }}>
      <DeleteOutlined onClick={() => setPrompt({ visible: true, loading: false })} />
    </Popconfirm>
  );
};
