import React, { useState, useEffect } from 'react';
import { Table, message, Tooltip, Divider, Space, Typography, Button } from 'antd';
import { useHistory } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { DeleteOutlined, EditOutlined, FolderOpenOutlined } from '@ant-design/icons';

import { authHeader, handleError } from '../../common/AuthHeader.js';
import MoveAssetsDialog from './MoveAssetsDialog';
// import { hasEditPermission } from '../../common/AuthUtil.js';
import { Constants } from '../../common/Constants';
import { assetsActions } from '../../../redux/actions/Assets';
import ReactMarkdown from 'react-markdown';
import DeleteAsset from '../../common/DeleteAsset';
import Text from '../../common/Text.jsx';

function AssetsTable({ openGroup, handleEditGroup, refreshGroups, editingAllowed }) {
  const { applicationReducer, assetReducer, groupsReducer } = useSelector((state) => ({
    groupsReducer: state.groupsReducer,
    applicationReducer: state.applicationReducer,
    assetReducer: state.assetReducer,
  }));

  const selectedGroup = groupsReducer;
  const history = useHistory();
  const dispatch = useDispatch();

  const applicationId = applicationReducer?.application?.applicationId || '';

  const { assetTypeFilter, keywords } = assetReducer.searchParams;
  const [assetToMove, setAssetToMove] = useState({ id: '', type: '', title: '', selectedKeys: {} });
  const [assets, setAssets] = useState([]);

  const fetchDataAndRenderTable = async () => {
    if (applicationId) {
      let url = '';
      if (keywords) {
        url = '/api/groups/assetsSearch?app_id=' + applicationId + '&keywords=' + keywords;
        if (assetTypeFilter) url += '&assetTypeFilter=' + assetTypeFilter;
        if (selectedGroup?.selectedKeys?.id) url += '&group_id=' + selectedGroup.selectedKeys.id;
      } else {
        url = '/api/groups/assets?app_id=' + applicationId;
        if (selectedGroup?.selectedKeys?.id) url += '&group_id=' + selectedGroup.selectedKeys.id;
      }
      try {
        const response = await fetch(url, { headers: authHeader() });
        if (!response.ok) handleError(response);
        const data = await response.json();
        setAssets(data);
      } catch (error) {
        console.log('-error-----------------------------------------');
        console.dir({ error }, { depth: null });
        console.log('------------------------------------------');
        message.error('Failed to fetch assets');
      }
    }
  };

  useEffect(() => {
    fetchDataAndRenderTable();
  }, [applicationId, assetTypeFilter, keywords, selectedGroup?.selectedKeys?.id]);

  //When edit icon is clicked
  const handleEdit = (id, type, action) => {
    dispatch(assetsActions.assetSelected(id, applicationId, ''));

    switch (type) {
      case 'File':
        history.push('/' + applicationId + '/assets/file/' + id);
        break;
      case 'File Template':
        history.push('/' + applicationId + '/assets/fileTemplate/' + id);
        break;
      case 'Job':
        history.push('/' + applicationId + '/assets/job/' + id);
        break;
      case 'Index':
        history.push('/' + applicationId + '/assets/index/' + id);
        break;
      case 'Query':
        history.push('/' + applicationId + '/assets/query/' + id);
        break;
      case 'Group':
        if (action !== 'edit') {
          openGroup(id);
        } else {
          handleEditGroup(id);
        }
        break;
      default:
        break;
    }
  };

  const openMoveAssetDialog = (assetId, assetType, assetTitle, selectedGroup) => {
    setAssetToMove({ id: assetId, type: assetType, title: assetTitle, selectedKeys: selectedGroup.selectedKeys });
  };

  const closeMoveDialog = () => {
    setAssetToMove({ id: '', type: '', title: '', selectedKeys: {} });
  };

  const handleDelete = (id, type) => {
    let deleteUrl = '',
      data = {},
      method = 'post';
    message.config({ top: 130 });
    switch (type) {
      case 'File':
        data = JSON.stringify({ fileId: id, application_id: applicationId });
        deleteUrl = '/api/file/read/delete';
        break;
      case 'File Template':
        data = JSON.stringify({ id, application_id: applicationId });
        deleteUrl = '/api/fileTemplate/read/deleteFileTemplate';
        break;
      case 'Index':
        data = JSON.stringify({ indexId: id, application_id: applicationId });
        deleteUrl = '/api/index/read/delete';
        break;
      case 'Job':
        data = JSON.stringify({ jobId: id, application_id: applicationId });
        deleteUrl = '/api/job/delete';
        break;
      case 'Query':
        data = JSON.stringify({ queryId: id, application_id: applicationId });
        deleteUrl = '/api/query/delete';
        break;
      case 'Group':
        data = JSON.stringify({ group_id: id, app_id: applicationId });
        deleteUrl = '/api/groups';
        method = 'delete';
        break;
      default:
        break;
    }
    fetch(deleteUrl, {
      method: method,
      headers: authHeader(),
      body: data,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((_result) => {
        fetchDataAndRenderTable();
        if (type === 'Group') {
          refreshGroups();
        }
        message.success(type + ' deleted successfully');
      })
      .catch((error) => {
        console.log(error);
        message.error('There was an error deleting the ' + type);
      });
  };

  const handleGroupClick = (groupId) => {
    if (!groupId) groupId = 'root';
    dispatch(assetsActions.assetInGroupSelected(groupId));
  };

  const generateAssetIcon = (type) => {
    const icons = {
      Job: <i className="fa fa-clock-o"></i>,
      File: <i className="fa fa-file"></i>,
      Index: <i className="fa fa-indent"></i>,
      Query: <i className="fa fa-search"></i>,
      Group: <i className="fa fa-folder-o"></i>,
      'File Template': <i className="fa fa-file-text-o"></i>,
    };
    return <React.Fragment>{icons[type]}</React.Fragment>;
  };

  // -------------------- SORTING AND FILTERING --------------------------//
  const [filters, setFilters] = useState({});

  const createUniqueFiltersArr = (baseArr, column) => {
    const columnsNames = { createdAt: 'createdAt', name: 'name', type: 'type' };
    if (!baseArr || !column || !columnsNames[column]) return [];
    const dictionary = baseArr.reduce(
      (acc, el) => {
        let key = el[column] || 'empty';
        if (column === 'createdAt') {
          key = new Date(el.createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
        }
        if (!acc[key]) {
          acc[key] = true;
          acc.result.push({ text: key, value: key });
        }
        return acc;
      },
      { result: [] }
    );
    return dictionary.result;
  };

  const handleTablechange = (pagination, filters, _sorter) => {
    const activeFilters = {};
    for (const key in filters) filters[key] && (activeFilters[key] = filters[key]);
    setFilters(() => activeFilters);
  };

  const handleClearFilters = (e) => {
    e.stopPropagation();
    setFilters(() => ({}));
  };

  // -------------------- SORTING AND FILTERING END--------------------------//

  const columns = [
    {
      title: <Text text="Name" />,
      dataIndex: 'name',
      width: '25%',
      ellipsis: {
        showTitle: false,
      },
      sorter: (a, b) => a.name.localeCompare(b.name),
      onFilter: (value, record) => record.name.includes(value),
      filters: createUniqueFiltersArr(assets, 'name'),
      filteredValue: filters.name || null,
      shouldCellUpdate: (record, prevRecord) => record.title !== prevRecord.title,
      render: (text, record) => (
        <Tooltip placement="topLeft" title={record.name}>
          <Space>
            {generateAssetIcon(record.type)}
            <Typography.Link onClick={() => handleEdit(record.id, record.type, 'view', record.url)}>
              {record.title ? record.title : text}
            </Typography.Link>
          </Space>
          {keywords && keywords.length > 0 ? (
            <span className={'group-name'}>
              In Group:{' '}
              <Typography.Link onClick={() => handleGroupClick(record.groupId)}>
                {record.group_name ? record.group_name : 'Groups'}
              </Typography.Link>{' '}
            </span>
          ) : null}
        </Tooltip>
      ),
    },
    {
      title: <Text text="Description" />,
      dataIndex: 'description',
      width: '23%',
      ellipsis: {
        showTitle: false,
      },
      shouldCellUpdate: (record, prevRecord) => record.description !== prevRecord.description,
      render: (text, _record) => (
        <Tooltip
          placement="topLeft"
          title={
            <div className="markdown-tooltip custom-scroll">
              <ReactMarkdown children={text} />
            </div>
          }>
          {text?.replace(/(?:__|[*#])|\[(.*?)\]\(.*?\)/gm, '')}
        </Tooltip>
      ),
    },
    {
      title: <Text text="Type" />,
      dataIndex: 'type',
      width: '10%',
      sorter: (a, b) => a.type.localeCompare(b.type),
      onFilter: (value, record) => record.type.includes(value),
      filters: createUniqueFiltersArr(assets, 'type'),
      filteredValue: filters.type || null,
      shouldCellUpdate: (record, prevRecord) => record.type !== prevRecord.type,
    },
    {
      title: <Text text="Created" />,
      dataIndex: 'createdAt',
      width: '23%',
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      onFilter: (value, record) => {
        const createdAt = new Date(record.createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
        return createdAt.includes(value);
      },
      filters: createUniqueFiltersArr(assets, 'createdAt'),
      filteredValue: filters.createdAt || null,
      shouldCellUpdate: (record, prevRecord) => record.createdAt !== prevRecord.createdAt,
      render: (text, _record) => {
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
      title: <Text text="Action" />,
      dataJob: '',
      className: editingAllowed ? 'show-column' : 'hide-column',
      shouldCellUpdate: (record, prevRecord) => record.id !== prevRecord.id,
      render: (text, record) => (
        <Space split={<Divider type="vertical" />}>
          <Tooltip placement="right" title={<Text text="Edit" />}>
            <EditOutlined
              className="asset-action-icon"
              onClick={() => handleEdit(record.id, record.type, 'edit', record.url)}
            />
          </Tooltip>

          <Tooltip placement="right" title={<Text text="Delete" />}>
            <DeleteAsset
              asset={record}
              onDelete={handleDelete}
              component={<DeleteOutlined className="asset-action-icon" />}
            />
          </Tooltip>

          <Tooltip placement="right" title={<Text text="Move" />}>
            <FolderOpenOutlined
              className="asset-action-icon"
              onClick={() => openMoveAssetDialog(record.id, record.type, record.name, selectedGroup)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <React.Fragment>
      <div style={{ position: 'relative' }}>
        <Button
          style={{
            display: !Object.keys(filters).length ? 'none' : 'inline-block',
            position: 'absolute',
            zIndex: '9999',
            left: '35%',
            top: '-15px',
          }}
          type="primary"
          size="small"
          onClick={handleClearFilters}
          shape="round">
          Remove Active Filters
        </Button>
        <Table
          columns={columns}
          rowKey={(record) => record.id}
          onChange={handleTablechange}
          dataSource={assets}
          pagination={assets?.length > 10 ? { pageSize: 10 } : false}
          scroll={{ y: '70vh' }}
          hideOnSinglePage={true}
        />
      </div>
      {assetToMove.id ? (
        <MoveAssetsDialog
          isShowing={!!assetToMove.id}
          toggle={closeMoveDialog}
          assetToMove={assetToMove}
          refreshGroups={refreshGroups}
          reloadTable={fetchDataAndRenderTable}
          application={applicationReducer.application}
        />
      ) : null}
    </React.Fragment>
  );
}

export default React.memo(AssetsTable);
