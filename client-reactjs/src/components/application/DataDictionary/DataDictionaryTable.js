import React, { useState, useEffect } from 'react'
import { Table, message, Popconfirm, Tooltip, Divider} from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { hasEditPermission } from "../../common/AuthUtil.js";
import useFileDetailsForm from '../../../hooks/useFileDetailsForm';
import { Constants } from '../../common/Constants';
import { useSelector } from "react-redux";
import DataDefinitionDetailsDialog from './DataDefinitionDetailsDialog';
import ReactMarkdown from 'react-markdown';
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined  } from '@ant-design/icons';

function DataDictionaryTable({dataDefinitions, applicationId, onDataUpdated, closeAddDlg}) {
  const [data, setData] = useState([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showFileDetailsDialog, setShowFileDetailsDialog] = useState(false);
  const [selectedDataDefinition, setSelectedDataDefinition] = useState(false);
  const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();

  const authReducer = useSelector(state => state.authenticationReducer);

  useEffect(() => {
    setData(dataDefinitions);
  }, [dataDefinitions])

  const handleEditDataDictionary = (selectedDataDefinition) => {
    setSelectedDataDefinition(selectedDataDefinition);
    if(selectedDataDefinition.type != 'file') {
      setShowDetailsDialog(true);
    } else {
      console.log('setShowFileDetailsDialog: '+setShowFileDetailsDialog)
      toggle();
      setShowFileDetailsDialog(true);
    }

  }

  const handleDataDictionaryDelete = (record) => {
    if(record.type != 'file') {
      fetch('/api/data-dictionary/delete', {
        headers: authHeader(),
        method: 'post',
        body: JSON.stringify({'id': record.id, 'application_id':applicationId})
      }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      }).then(function(data) {
        onDataUpdated();
        message.config({top:130})
        message.success("Data Definition deleted sucessfully");
      }).catch(error => {
        console.log(error);
        message.config({top:130})
        message.error("There was an error deleting the Data Definition");
      });
    } else {
      handleFileDelete(record.id);
    }
  }

  const handleFileDelete = (fileId) => {
    var data = JSON.stringify({fileId: fileId, application_id: applicationId});
    fetch("/api/file/read/delete", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(result => {
      onDataUpdated();
      message.config({top:130})
      message.success("File deleted sucessfully");
    }).catch(error => {
      console.log(error);
      message.config({top:130})
      message.error("There was an error deleting the file");
    });
  }

  const closeDialog = () => {
    setShowDetailsDialog(false);
    closeAddDlg();
  }

  const closeFileDialog = () => {
    setShowFileDetailsDialog(false);
    //closeAddDlg();
    toggle();
  }

  const onRefresh = () => {
    setShowFileDetailsDialog(false);
    toggle();
    onDataUpdated();
  }

  const editingAllowed = hasEditPermission(authReducer.user);

  const dataDefnCols = [{
    title: 'Name',
    dataIndex: 'name',
    width: '20%',
    ellipsis: true,
    render: (text, record) => <a onClick={() => handleEditDataDictionary(record)} >{text}</a>
  },
  {
    title: 'Description',
    dataIndex: 'description',
    className: 'overflow-hidden',
    ellipsis: true,
    width: '20%',
    render: (text, record) => <ReactMarkdown children={text} />
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
    width: '10%',
    title: 'Action',
    dataIndex: '',
    className: editingAllowed ? "show-column" : "hide-column",
    render: (text, record) =>
      <span>
        <a href="#" onClick={(row) => handleEditDataDictionary(record)}><Tooltip placement="right" title={"Edit Dataflow"}><EditOutlined /></Tooltip></a>
        <Divider type="vertical" />
          <Popconfirm title={record.type != 'file' ? "Are you sure you want to delete this Data Definition?" : "Are you sure you want to delete this File?"} onConfirm={() => handleDataDictionaryDelete(record)} icon={<QuestionCircleOutlined />}>
            <a href="#"><Tooltip placement="right" title={"Delete Data Definition"}><DeleteOutlined /></Tooltip></a>
          </Popconfirm>
      </span>
  }];
	return (
	  <React.Fragment>
	   <Table
        columns={dataDefnCols}
        rowKey={record => record.id}
        dataSource={data}
        pagination={{ pageSize: 20 }}
        scroll={{ y: '70vh' }}
      />
      {showDetailsDialog ? <DataDefinitionDetailsDialog selectedDataDefinition={selectedDataDefinition} applicationId={applicationId} onDataUpdated={onDataUpdated} closeDialog={closeDialog}/> : null}

      {showFileDetailsDialog ?
        OpenDetailsForm({
          "type": "file",
          "onRefresh":onRefresh,
          "isNew":false,
          "selectedAsset": selectedDataDefinition.id,
          "applicationId": applicationId,
          "selectedDataflow": '',
          "onClose": closeFileDialog,
          "user": authReducer.user}) : null}
     </React.Fragment>
	  )

}

export default DataDictionaryTable