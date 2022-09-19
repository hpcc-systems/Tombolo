import { FileTextOutlined, TagOutlined } from '@ant-design/icons';
import { Divider, Space, Table, Tag, Typography } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';

import ConstraintsTags from '../Constraints/ConstraintsTags';
import BaseLine from './BaseLine';
import DeleteReport from './DeleteReport';

const ReportTable = ({ type = 'current', data = null }) => {
  const propagation = useSelector((state) => state.propagation);

  let columns = [
    {
      title: 'Reports',
      dataIndex: 'createdAt',
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      render: (text, record) => (
        <>
          {new Date(text).toLocaleString()}
          {!record.isBaseLine ? null : (
            <Tag style={{ marginLeft: '15px' }} icon={<TagOutlined />} color="success">
              Base line report
            </Tag>
          )}
        </>
      ),
    },
    {
      title: 'Action',
      key: 'x',
      render: (record) => (
        <Space split={<Divider type="vertical" />}>
          {type === 'changes' ? null : <BaseLine record={record} />}
          <DeleteReport record={record} />
        </Space>
      ),
    },
  ];

  const getColumns = () => {
    if (data) return [columns[0]];
    if (type === 'changes') {
      const comparedTo = {
        title: 'Compared to base line',
        dataIndex: 'comparedName',
        render: (text) => (text ? new Date(text).toLocaleString() : ''),
      };
      return [columns[0], comparedTo, columns[1]];
    }
    return columns;
  };

  const dataSource = data || propagation.reports.filter((report) => report.type === type);
  const report = propagation[type];

  if (!report) return 'Wrong report type passed!';

  return (
    <Table
      size="small"
      columns={getColumns()}
      pagination={false}
      loading={data ? false : report.loading}
      rowKey={(record) => record.id}
      dataSource={dataSource}
      expandable={{
        expandedRowRender: (record) => {
          const innerColumns = [
            {
              title: 'Field',
              dataIndex: 'name',
              width: '20%',
              sorter: (a, b) => a.name.localeCompare(b.name),
            },
          ];

          const options = {
            changes: [
              {
                title: 'Added',
                dataIndex: 'added',
                width: '40%',
                key: 'id',
                render: (text, record) => {
                  return <ConstraintsTags list={record.added} />;
                },
              },
              {
                title: 'Removed',
                dataIndex: 'removed',
                key: 'id',
                width: '40%',
                render: (text, record) => {
                  return <ConstraintsTags list={record.removed} />;
                },
              },
            ],
            current: [
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
          };

          // if type is passed, then add column
          if (options[type]) innerColumns.push(...options[type]);

          return record.report.map((file) => {
            return (
              <div key={file.name}>
                <Table
                  bordered
                  size="small"
                  style={{ marginBottom: '10px' }}
                  columns={innerColumns}
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
              </div>
            );
          });
        },
      }}
    />
  );
};

export default ReportTable;
