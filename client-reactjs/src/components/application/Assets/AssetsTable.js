import React, { useState, useEffect } from 'react'
import { Table, message, Popconfirm, Icon, Tooltip, Divider} from 'antd/lib';
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
    if(selectedGroup != '') {
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
    if(type != 'Group') {
      dispatch(assetsActions.assetSelected(
        id,
        applicationId,
        ''
      ));
      history.push('/' + applicationId + '/file/' + id);
    } else {
      selectedGroup = {id:id};
      fetchDataAndRenderTable();
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
    /*switch(type) {
      case 'file':
        if(id) {
          handleFileDelete(id, applicationId).then(() => {
            updateGraph(id, applicationId, selectedDataflow).then((response) => {
              fetchDataAndRenderTable();
            });
          })
        }
        break;
      case 'index':
        if(id) {
          handleIndexDelete(id, applicationId).then(() => {
            updateGraph(id, applicationId, selectedDataflow).then((response) => {
              fetchDataAndRenderTable();
            });
          })
        }
        break;
      case 'job':
        if(id) {
          handleJobDelete(id, applicationId).then(() => {
            updateGraph(id, applicationId, selectedDataflow).then((response) => {
              fetchDataAndRenderTable();
            });
          })
        }
        break;
    }*/
  }

  const editingAllowed = hasEditPermission(authReducer.user);

  const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: '20%',
    ellipsis: true,
    render: (text, record) => <a href='#' onClick={(row) => handleEdit(record.id, record.type)}>{text}</a>
  },
  {
    title: 'Description',
    dataIndex: 'description',
    width: '25%',
    ellipsis: true
  },
  {
    title: 'Type',
    dataIndex: 'type',
    width: '10%',
  },
  {
    width: '15%',
    title: 'Action',
    dataJob: '',
    className: editingAllowed ? "show-column" : "hide-column",
    render: (text, record) =>
      <span>
        <a href="#" onClick={(row) => handleEdit(record.id, record.type)}><Tooltip placement="right" title={"Edit"}><Icon type="edit" /></Tooltip></a>
        <Divider type="vertical" />
        <Popconfirm title="Are you sure you want to delete this?" onConfirm={() => handleDelete(record.id, record.objType)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
          <a href="#"><Tooltip placement="right" title={"Delete"}><Icon type="delete" /></Tooltip></a>
        </Popconfirm>
        <Divider type="vertical" />
        <a href="#" onClick={(row) => handleMoveAsset(record.id, record.type, record.name, selectedGroup)}><Tooltip placement="right" title={"Move"}><Icon type="folder-open" /></Tooltip></a>
      </span>
  }];

  return (
    <React.Fragment>
    <div style={{"height": "85%"}}>
      <Table
        columns={columns}
        rowKey={record => record.id}
        dataSource={assets}
        pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
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