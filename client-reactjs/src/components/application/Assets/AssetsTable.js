import React, { useState, useEffect } from 'react'
import { Table, message, Popconfirm, Tooltip, Divider} from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import FileDetailsForm from "../FileDetails";
import MoveAssetsDialog from "./MoveAssetsDialog";
import { hasEditPermission } from "../../common/AuthUtil.js";
import useFileDetailsForm from '../../../hooks/useFileDetailsForm';
import {handleFileDelete, handleJobDelete, handleIndexDelete, handleQueryDelete, updateGraph} from "../../common/WorkflowUtil";
import { useSelector, useDispatch } from "react-redux";
import { Constants } from '../../common/Constants';
import { assetsActions } from '../../../redux/actions/Assets';
import { useHistory } from 'react-router';
import useModal from '../../../hooks/useModal';
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined, FolderOpenOutlined  } from '@ant-design/icons';

function AssetsTable(props) {
  let {selectedGroup} = props;
  const [assets, setAssets] = useState([]);
  const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();
  const authReducer = useSelector(state => state.authenticationReducer);
  const applicationReducer = useSelector(state => state.applicationReducer);
  const history = useHistory();
  const applicationId = applicationReducer.application ? applicationReducer.application.applicationId : '';
  const {showMoveDialog=isShowing, toggleMoveDialog=toggle} = useModal();
  let assetId = '', assetType = '';
  const [assetToMove, setAssetToMove] = useState({
    id: '',
    type: '',
    title: '',
    selectedGroup: {}
  });

  useEffect(() => {
    if(applicationId && selectedGroup && selectedGroup.groupId != '') {
      fetchDataAndRenderTable();
    }
  }, [applicationId, selectedGroup]);

  const dispatch = useDispatch();

  const fetchDataAndRenderTable = () => {
    let url = "/api/groups/assets?app_id="+applicationId;
    if(selectedGroup && selectedGroup.id) {
      url += '&group_id='+selectedGroup.id;
    }
    fetch(url, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      setAssets(data)
    }).catch(error => {
      console.log(error);
    });
  }

  const handleEdit = (id, type) => {
    console.log(type);
    dispatch(assetsActions.assetSelected(
      id,
      applicationId,
      ''
    ));

    switch (type) {
      case 'File':
        history.push('/' + applicationId + '/file/' + id);
        break;
      case 'Job':
        history.push('/' + applicationId + '/job/' + id);
        break;
      case 'Index':
        history.push('/' + applicationId + '/index/' + id);
        break;
      case 'Query':
        history.push('/' + applicationId + '/query/' + id);
        break;
      case 'Group':
        props.handleEditGroup(id);
        break;
      default:
        break

    }
  }

  const handleClose = () => {
    //toggle();
  }

  const handleMoveAsset = (assetId, assetType, assetTitle) => {
    setAssetToMove({id: assetId, type: assetType, title: assetTitle, selectedGroup: selectedGroup})
    toggleMoveDialog();
  }

  const handleDelete = (id, type) => {
    let deleteUrl='', data={}, method='post';
    message.config({top:130})
    switch(type) {
      case 'File':
        data = JSON.stringify({fileId: id, application_id: applicationId});
        deleteUrl = '/api/file/read/delete';
        break;
      case 'Index':
        data = JSON.stringify({indexId: id, application_id: applicationId});
        deleteUrl = '/api/index/read/delete';
        break;
      case 'Job':
        data = JSON.stringify({jobId: id, application_id: applicationId});
        deleteUrl = '/api/job/delete';
        break;
      case 'Query':
        data = JSON.stringify({queryId: id, application_id: applicationId});
        deleteUrl = '/api/query/delete';
        break;
      case 'Group':
        data = JSON.stringify({group_id: id, app_id: applicationId});
        deleteUrl = '/api/groups';
        method='delete'
        break;
    }
    fetch(deleteUrl, {
      method: method,
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(result => {
      fetchDataAndRenderTable();
      if(type == 'Group') {
        props.refreshGroups();
      }
      message.success(type + " deleted sucessfully");
    }).catch(error => {
      console.log(error);
      message.error("There was an error deleting the "+type);
    });
  }

  const editingAllowed = hasEditPermission(authReducer.user);

  const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: '20%',
    render: (text, record) => <a href='#' onClick={(row) => handleEdit(record.id, record.type)}>{text}</a>
  },
  {
    title: 'Description',
    dataIndex: 'description',
    width: '15%',
    ellipsis: true
  },
  {
    title: 'Type',
    dataIndex: 'type',
    width: '5%',
  },
  {
    title: 'Created',
    dataIndex: 'createdAt',
    width: '20%',
    render: (text, record) => {
      let createdAt = new Date(text);
      return createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ createdAt.toLocaleTimeString('en-US')
    }
  },
  {
    width: '15%',
    title: 'Action',
    dataJob: '',
    className: editingAllowed ? "show-column" : "hide-column",
    render: (text, record) =>
      <span>
        <a href="#" onClick={(row) => handleEdit(record.id, record.type)}><Tooltip placement="right" title={"Edit"}><EditOutlined /></Tooltip></a>
        <Divider type="vertical" />
        <Popconfirm title="Are you sure you want to delete this?" onConfirm={() => handleDelete(record.id, record.type)} icon={<QuestionCircleOutlined/>}>
          <a href="#"><Tooltip placement="right" title={"Delete"}><DeleteOutlined /></Tooltip></a>
        </Popconfirm>
        <Divider type="vertical" />
        <a href="#" onClick={(row) => handleMoveAsset(record.id, record.type, record.name, selectedGroup)}><Tooltip placement="right" title={"Move"}><FolderOpenOutlined /></Tooltip></a>
      </span>
  }];

  return (
    <React.Fragment>
    <div>
      <Table
        columns={columns}
        rowKey={record => record.id}
        dataSource={assets}
        pagination={{ pageSize: 20 }}
        scroll={{ y: '70vh' }}
      />
    </div>
    {showMoveDialog ?
      <MoveAssetsDialog
        isShowing={showMoveDialog}
        toggle={toggleMoveDialog}
        application={applicationReducer.application}
        assetToMove={assetToMove}
        reloadTable={fetchDataAndRenderTable}/>
    : null }
    </React.Fragment>
  )
}

function areEqual(prevProps, nextProps) {
  if(prevProps.selectedGroup != nextProps.selectedGroup) {
    return false;
  } else {
    return true;
  }
}
export default React.memo(AssetsTable, areEqual);