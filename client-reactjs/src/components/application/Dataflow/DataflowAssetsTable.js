import React, { useState, useEffect } from 'react'
import { Table, message, Popconfirm, Icon, Tooltip, Divider} from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { hasEditPermission } from "../../common/AuthUtil.js";
import FileDetailsForm from "../FileDetails";
import useFileDetailsForm from '../../../hooks/useFileDetailsForm';
import {handleFileDelete, handleJobDelete, handleIndexDelete, handleQueryDelete, updateGraph} from "../../common/WorkflowUtil";
import { useSelector } from "react-redux";

function DataflowAssetsTable({applicationId, selectedDataflow, user}) {
	const [dataflowAssets, setDataflowAssets] = useState([]);
	const [selectedAsset, setSelectedAsset] = useState({id:'', type:''});
	const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();

	useEffect(() => {	  
	  if(applicationId) {
	  	fetchDataAndRenderTable();  
	  }
	}, []);

  const authReducer = useSelector(state => state.authenticationReducer);

	const fetchDataAndRenderTable = () => {
    fetch("/api/dataflow/assets?app_id="+applicationId+"&dataflowId="+selectedDataflow.id, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      setDataflowAssets(data)
    }).catch(error => {
      console.log(error);
    });
  }

  const handleEdit = (id, type) => {
  	setSelectedAsset({id:id, type:type})
  	toggle();
  }

  const handleClose = () => {
    toggle();
  }

  const handleDelete = (id, type) => {
  	switch(type) {
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
	  }
  }

  const editingAllowed = hasEditPermission(authReducer.user);

	const jobColumns = [{
    title: 'Type',
    dataIndex: 'objType',
    width: '30%',
  },
  {
    title: 'Name',
    dataIndex: 'name',
    width: '30%',
    render: (text, record) => <a href='#' onClick={(row) => handleEdit(record.id, record.objType)}>{text}</a>
  },
  {
    title: 'Description',
    dataIndex: 'description',
    width: '30%',
  },
  {
    width: '30%',
    title: 'Action',
    dataJob: '',
    className: editingAllowed ? "show-column" : "hide-column",
    render: (text, record) => 
      <span>
        <a href="#" onClick={(row) => handleEdit(record.id, record.objType)}><Tooltip placement="right" title={"Edit"}><Icon type="edit" /></Tooltip></a>
        <Divider type="vertical" />
        <Popconfirm title="Are you sure you want to delete this?" onConfirm={() => handleDelete(record.id, record.objType)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
          <a href="#"><Tooltip placement="right" title={"Delete"}><Icon type="delete" /></Tooltip></a>
        </Popconfirm>
      </span>
  }];

  return (
	  <React.Fragment>
    <div style={{"height": "85%"}}>
		  <Table
        columns={jobColumns}
        rowKey={record => record.id}
        dataSource={dataflowAssets}
        pagination={{ pageSize: 10 }} scroll={{ y: 460 }}        
			/>
			{isShowing ?
				OpenDetailsForm({
					"type": selectedAsset.type,
					"onRefresh":fetchDataAndRenderTable,
					"isNew":false,
	        "selectedAsset": selectedAsset.id,
	        "applicationId": applicationId,
	        "selectedDataflow": selectedDataflow,
          "onClose": handleClose,
	        "user": user}) : null}
		</div>
    </React.Fragment>			    
	)
}
export default DataflowAssetsTable