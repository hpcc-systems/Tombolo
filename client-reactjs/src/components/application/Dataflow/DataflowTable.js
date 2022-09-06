import React, { useState, useEffect } from 'react';
import { Table, Popconfirm, Tooltip, Divider } from 'antd';
import ReactMarkdown from 'react-markdown';
import { DeleteOutlined, EyeOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { authHeader, handleError } from '../../common/AuthHeader.js';
import { hasEditPermission } from '../../common/AuthUtil.js';
import { Constants } from '../../common/Constants';
import { useSelector } from 'react-redux';

function DataflowTable({ data, applicationId, onSelectDataflow, onDataFlowUpdated, onEditDataFlow }) {
  const { t } = useTranslation(['common']); // t for translate -> getting namespaces relevant to this file
  const authReducer = useSelector((state) => state.authenticationReducer);
  const editingAllowed = hasEditPermission(authReducer.user);

  // eslint-disable-next-line unused-imports/no-unused-vars
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      setSelectedRowKeys([data[0].id]);
      //onSelectDataflow(data[0]);
    } else {
      //clear svg if no data
      //onSelectDataflow('');
    }
  }, [data]);

  const handleDataflowDelete = (id) => {
    fetch('/api/dataflow/delete', {
      headers: authHeader(),
      method: 'post',
      body: JSON.stringify({ dataflowId: id, applicationId: applicationId }),
    })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(function () {
        onDataFlowUpdated();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const rowSelected = (record) => {
    setSelectedRowKeys([record.id]);
    onSelectDataflow(record);
  };

  const dataflowCols = [
    {
      title: t('Name', { ns: 'common' }),
      dataIndex: 'title',
      width: '30%',
      render: (text, record) => <a onClick={() => rowSelected(record)}>{text}</a>,
    },
    {
      title: t('Description', { ns: 'common' }),
      dataIndex: 'description',
      className: 'overflow-hidden',
      ellipsis: true,
      width: '30%',
      // render: (text, record) => <ReactMarkdown children={text} />
      render: (text) => (
        <span className="description-text">
          <ReactMarkdown children={text} />
        </span>
      ),
    },
    {
      title: t('Process Type', { ns: 'common' }),
      dataIndex: 'type',
      width: '30%',
    },
    {
      title: t('Created', { ns: 'common' }),
      dataIndex: 'createdAt',
      width: '30%',
      render: (text) => {
        let createdAt = new Date(text);
        return (
          createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
          ' @ ' +
          createdAt.toLocaleTimeString('en-US')
        );
      },
    },
    {
      width: '20%',
      title: t('Action', { ns: 'common' }),
      dataIndex: '',
      className: editingAllowed ? 'show-column' : 'hide-column',
      render: (text, record) => (
        <span>
          <a onClick={() => onEditDataFlow(record)}>
            <Tooltip placement="right" title={'Edit Dataflow'}>
              <EyeOutlined />
            </Tooltip>
          </a>
          <Divider type="vertical" />
          <Popconfirm
            title="Are you sure you want to delete this Dataflow and it's associated graph?"
            onConfirm={() => handleDataflowDelete(record.id)}
            icon={<QuestionCircleOutlined />}>
            <a href="#">
              <Tooltip placement="right" title={'Delete Dataflow'}>
                <DeleteOutlined />
              </Tooltip>
            </a>
          </Popconfirm>
        </span>
      ),
    },
  ];
  return (
    <React.Fragment>
      <Table
        columns={dataflowCols}
        rowKey={(record) => record.id}
        dataSource={data}
        pagination={{ pageSize: 5 }}
        scroll={{ y: 380 }}
      />
    </React.Fragment>
  );
}

export default DataflowTable;
