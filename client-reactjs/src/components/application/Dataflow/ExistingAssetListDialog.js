import React, { useState, useEffect } from 'react';
import { Button, message, Modal, Table, Tooltip } from 'antd/lib';
import { authHeader, handleError } from '../../common/AuthHeader.js';

import { useSelector } from 'react-redux';
import { hasEditPermission } from '../../common/AuthUtil.js';
import { Constants } from '../../common/Constants';

function ExistingAssetListDialog({ show, applicationId, dataflowId, clusterId, assetType, onClose }) {
  const [assets, setAssets] = useState([]);
  const authReducer = useSelector((state) => state.authenticationReducer);
  const editingAllowed = hasEditPermission(authReducer.user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (applicationId) {
      (async () => {
        const queryParams = `app_id=${applicationId}&dataflowId=${dataflowId}&clusterId=${clusterId}`;
        const options = {
          File: `/api/file/read/file_list?${queryParams}`,
          Index: `/api/index/read/index_list?${queryParams}`,
          Job: `/api/job/job_list?${queryParams}`, //  'Job'- 'Modeling'- 'Scoring'- 'ETL'- 'Query Build'- 'Data Profile'
          default: `/api/job/job_list?${queryParams}`,
        };

        const url = options[assetType] || options.default;

        try {
          const response = await fetch(url, { headers: authHeader() });
          if (!response.ok) handleError(response);
          const data = await response.json();
          setAssets(data);
        } catch (error) {
          console.log(`error`, error);
          message.error('Could not download assets list');
        }
      })();
    }
    return () => {
      setLoading(false);
    };
  }, []);

  const assetColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      width: '30%',
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      width: '20%',
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: '35%',
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      width: '20%',
      ellipsis: {
        showTitle: false,
      },
      render: (text, record) => {
        let createdAt = new Date(text);
        return (
          <Tooltip
            placement="topLeft"
            title={
              createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
              ' @ ' +
              createdAt.toLocaleTimeString('en-US')
            }
          >
            {createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
              ' @ ' +
              createdAt.toLocaleTimeString('en-US')}
          </Tooltip>
        );
      },
    },
    {
      width: '15%',
      title: 'Action',
      dataJob: '',
      className: editingAllowed ? 'show-column' : 'hide-column',
      render: (text, record) => (
        <span>
          <Button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setLoading(true);
              onClose({
                ...record,
                assetType,
                isAssociated: record?.metaData?.isAssociated ? true: false,
              });
            }}
          >
            Select
          </Button>
        </span>
      ),
    },
  ];

  if (assetType === 'File') {
    const isSuperFileColumn = {
      title: 'Is Superfile?',
      dataIndex: 'isSuperFile',
      width: '16%',
      render: (text, record) => `${text ? 'Yes' : 'No'}`,
    };
    assetColumns.splice(2, 0, isSuperFileColumn);
  }

  if (assetType === 'Job' || assetType === 'File') {
    const isJobAssociated =   {
      title: 'Production',
      width: '20%',
      render: (text, record) => {
        return record?.metaData?.isAssociated ? 'Yes' : 'No'
      }
    };
    assetColumns.splice(2, 0, isJobAssociated);
  }

  return (
    <Modal
      title={'Select from existing ' + assetType}
      visible={show}
      destroyOnClose={true}
      onCancel={() => {
        if (loading) return;
        onClose();
      }}
      maskClosable={false}
      width="1200px"
      footer={[
        <Button key="cancel" disabled={loading} onClick={() => onClose()}>
          Cancel
        </Button>,
      ]}
    >
      <Table
        loading={loading}
        columns={assetColumns}
        rowKey={(record) => record.id}
        dataSource={assets}
        pagination={{ pageSize: 10 }}
        scroll={{ y: 460 }}
      />
    </Modal>
  );
}
export default ExistingAssetListDialog;
