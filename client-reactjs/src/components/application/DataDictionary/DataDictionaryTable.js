import React, { useState, useEffect } from 'react'
import { Table, message, Popconfirm, Icon, Tooltip, Divider} from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { hasEditPermission } from "../../common/AuthUtil.js";
import { Constants } from '../../common/Constants';
import { useSelector } from "react-redux";
import DataDefinitionDetailsDialog from './DataDefinitionDetailsDialog';

function DataDictionaryTable({dataDefinitions, applicationId, onDataUpdated}) {
  const [data, setData] = useState([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedDataDefinition, setSelectedDataDefinition] = useState(false);

  const authReducer = useSelector(state => state.authenticationReducer);

  useEffect(() => {    
    setData(dataDefinitions);
  }, [dataDefinitions])

  const handleEditDataDictionary = (selectedDataDefinition) => {
    setSelectedDataDefinition(selectedDataDefinition);
    setShowDetailsDialog(true);
  }

  const handleDataDictionaryDelete = (id) => {
    fetch('/api/data-dictionary/delete', {
      headers: authHeader(),
      method: 'post',
      body: JSON.stringify({'id': id, 'application_id':applicationId})
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      onDataUpdated();
    }).catch(error => {
      console.log(error);
    });
  }  

  const editingAllowed = hasEditPermission(authReducer.user);

  const dataDefnCols = [{
    title: 'Name',
    dataIndex: 'name',
    width: '30%',
    render: (text, record) => <a onClick={() => handleEditDataDictionary(record)} >{text}</a>
  },
  {
    title: 'Description',
    dataIndex: 'description',
    width: '30%',
  },
  {
    title: 'Created',
    dataIndex: 'createdAt',
    width: '30%',
    render: (text, record) => {
      let createdAt = new Date(text);
      return createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ createdAt.toLocaleTimeString('en-US') 
    }
  },
  {
    width: '20%',
    title: 'Action',
    dataIndex: '',
    className: editingAllowed ? "show-column" : "hide-column",    
    render: (text, record) =>
      <span>
        <a href="#" onClick={(row) => handleEditDataDictionary(record)}><Tooltip placement="right" title={"Edit Dataflow"}><Icon type="edit" /></Tooltip></a>
        <Divider type="vertical" />
        <Popconfirm title="Are you sure you want to delete this Data Definition?" onConfirm={() => handleDataDictionaryDelete(record.id)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
          <a href="#"><Tooltip placement="right" title={"Delete Data Defintion"}><Icon type="delete" /></Tooltip></a>
        </Popconfirm>
      </span>
  }];
	return (
	  <React.Fragment>
	   <Table        
        columns={dataDefnCols}
        rowKey={record => record.id}
        dataSource={data}        
        pagination={{ pageSize: 5 }} scroll={{ y: 380 }}
      />
      {showDetailsDialog ? <DataDefinitionDetailsDialog selectedDataDefinition={selectedDataDefinition} applicationId={applicationId} onDataUpdated={onDataUpdated}/> : null}
     </React.Fragment>
	  )  

}

export default DataDictionaryTable