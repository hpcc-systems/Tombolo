import React, { useState, useEffect } from 'react'
import { Table, message, Popconfirm, Icon, Tooltip, Divider} from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { hasEditPermission } from "../../common/AuthUtil.js";
import { Constants } from '../../common/Constants';
import { useSelector } from "react-redux";

function DataflowTable({data, applicationId, onSelectDataflow, onDataFlowUpdated, onDataFlowEdit}) {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  

  useEffect(() => {    
    if(data && data.length > 0) {
      setSelectedRowKeys([data[0].id]);
      //onSelectDataflow(data[0]);
    } else {
      //clear svg if no data
      //onSelectDataflow('');
    }
   }, [data])

  const authReducer = useSelector(state => state.authenticationReducer);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys([selectedRows[0].id]);
      onSelectDataflow(selectedRows[0]);
    }
  }

  const handleEditDataflow = (selectedDataflow) => {
    onDataFlowEdit(selectedDataflow);
  }

  const handleDataflowDelete = (id) => {
    fetch('/api/dataflow/delete', {
      headers: authHeader(),
      method: 'post',
      body: JSON.stringify({'dataflowId': id, 'applicationId':applicationId})
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      onDataFlowUpdated();
    }).catch(error => {
      console.log(error);
    });
  }

  const rowSelected = (record, rowIndex) => {
    setSelectedRowKeys([record.id]);
    onSelectDataflow(record);
  }

  const editingAllowed = hasEditPermission(authReducer.user);

  const dataflowCols = [{
    title: 'Name',
    dataIndex: 'title',
    width: '30%',
    render: (text, record) => <a onClick={(row) => rowSelected(record)}>{text}</a>
  },
  {
    title: 'Description',
    dataIndex: 'description',
    width: '30%',
  },
  {
    title: 'Process Type',
    dataIndex: 'type',
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
        <a href="#" onClick={(row) => handleEditDataflow(record)}><Tooltip placement="right" title={"Edit Dataflow"}><Icon type="edit" /></Tooltip></a>
        <Divider type="vertical" />
        <Popconfirm title="Are you sure you want to delete this Dataflow and it's associated graph?" onConfirm={() => handleDataflowDelete(record.id)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
          <a href="#"><Tooltip placement="right" title={"Delete Dataflow"}><Icon type="delete" /></Tooltip></a>
        </Popconfirm>
      </span>
  }];
	return (
	  <React.Fragment>
	   <Table        
        columns={dataflowCols}
        rowKey={record => record.id}
        dataSource={data}        
        pagination={{ pageSize: 5 }} scroll={{ y: 380 }}
      />

     </React.Fragment>
	  )  

}

export default DataflowTable