import React, { useState, useEffect } from 'react'
import { Table, message, Popconfirm, Icon, Tooltip, Divider} from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { Constants } from '../../common/Constants';

function DataflowTable({data, applicationId, onSelectDataflow, onDataFlowUpdated, onDataFlowEdit}) {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  

  useEffect(() => {    
    if(data && data.length > 0) {
      setSelectedRowKeys([data[0].id]);
      onSelectDataflow(data[0]);
    } else {
      //clear svg if no data
      onSelectDataflow('');
    }
   }, [data])

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

  const dataflowCols = [{
    title: 'Title',
    dataIndex: 'title',
    width: '30%',
    render: text => <a>{text}</a>
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
    width: '30%',
    title: 'Action',
    dataJob: '',
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
        onRow={(record, rowIndex) => {
          return {
            onClick: event => {rowSelected(record, rowIndex)}
          }
        }}
        columns={dataflowCols}
        rowKey={record => record.id}
        dataSource={data}
        bordered
        pagination={{ pageSize: 5 }} scroll={{ y: 380 }}
      />

     </React.Fragment>
	  )  

}

export default DataflowTable