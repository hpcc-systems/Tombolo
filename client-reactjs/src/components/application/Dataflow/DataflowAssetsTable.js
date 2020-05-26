import React, { useState, useEffect } from 'react'
import { Table, message, Popconfirm, Icon, Tooltip, Divider} from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import FileDetailsForm from "../FileDetails";
import useFileDetailsForm from '../../../hooks/useFileDetailsForm';
import {handleFileDelete, handleJobDelete, handleIndexDelete, handleQueryDelete, updateGraph} from "../../common/WorkflowUtil";

function DataflowAssetsTable({applicationId, selectedDataflow, user}) {
	const [dataflowAssets, setDataflowAssets] = useState([]);
	const [selectedAsset, setSelectedAsset] = useState({id:'', type:''});
	const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();

	useEffect(() => {	  
	  if(applicationId) {
	  	fetchDataAndRenderTable();  
	  }
	}, []);

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

	const jobColumns = [{
    title: 'Title',
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
    title: 'Type',
    dataIndex: 'objType',
    width: '30%',
  },
  {
    width: '30%',
    title: 'Action',
    dataJob: '',
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
	        "user": user}) : null}
		</React.Fragment>			
	)
}
export default DataflowAssetsTable