import { Table,Spin, Tooltip, Divider, message, Popconfirm, Icon, Drawer, Button } from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js";
import ReactDOM from 'react-dom';

class FileReport extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    fileList:this.props.fileList,
    openFileLayout:false,
    selectedFileId:"",
    selectedFileTitle:"",
    fileLayout: [],
    initialDataLoading: false
  }

  componentDidMount() {        
  }

  componentWillReceiveProps(props) {
    this.setState({
      fileList: props.fileList
      });
      if(props.fileList && props.fileList.length>0)
        this.fetchDataAndRenderTable(props.fileList[0]); 
      else{   
      this.setState({
        openFileLayout:false
        });
      }  
  }
  
  fetchDataAndRenderTable(record) {
    this.setState({
      selectedFileId:record.id,
      selectedFileTitle:(record.title)?record.title:record.name,
      openFileLayout: true,
      initialDataLoading: true
    });
    fetch("/api/report/read/fileLayout?file_id="+record.id, {
        headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      window.scrollTo({ top: 400, behavior: 'smooth'})       
      this.setState({
        fileLayout: data
      });
      setTimeout(() => {
        this.setState({
          initialDataLoading: false
        });
      }, 200);      
    }).catch(error => {
      console.log(error);
    });
  }
  onClickRow = (record) => {     
    this.fetchDataAndRenderTable(record);
  }
  setRowClassName = (record) => {
    return record.id === this.state.selectedFileId ? 'clickRowStyl' : '';
  }
  render() {
    const indexColumns = [{
      title: 'Title',
      dataIndex: 'title',
      width: '20%'
    },
    {
      width: '20%',
      title: 'Name',
      dataIndex: 'name'
    },
    {
      width: '20%',
      title: 'Application',
      dataIndex: 'application.title'
    },
    {
      width: '20%',
      title: 'Description',
      dataIndex: 'description'
    },
    {
        width: '10%',
        title: 'Type',
        dataIndex: 'fileType'
    },
    {
        width: '15%',
        title: 'Qualified Path',
        dataIndex: 'qualifiedPath'
    }];

   
    let table = null;    
      table = <Table 
      columns={indexColumns}
      rowKey={record => record.id}
      dataSource={this.state.fileList}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1000 }}
      size="middle"
      onRowClick={this.onClickRow} 
      rowClassName={this.setRowClassName}
      // onRow={this.onClickRow}
    />
    const layoutColumns = [{
      title: 'Name',
      dataIndex: 'name',
      width: '20%',
    },
    {
      title: 'Type',
      dataIndex: 'type'
    },
    {
      title: 'Display Size',
      dataIndex: 'displaySize'
    },
    {
      title: 'Display Type',
      dataIndex: 'displayType'
    },
    {
      title: 'Text Justification',
      dataIndex: 'textJustification'
    },
    {
      title: 'Format',
      dataIndex: 'format'
    },
    {
      title: 'PCI',
      dataIndex: 'isPCI'
    },
    {
      title: 'PII',
      dataIndex: 'isPII'
    }];

  const title="File ("+this.state.selectedFileTitle+") Layout"
    return (
      <div>        
        {table}     
        {this.state.openFileLayout ? <div ref="divFileLayout">    
      <div style={{paddingBottom:"5px"}}>
        <h6>{title}</h6>
      </div>
      <div id={this.layoutDiv}>
     
        <Spin spinning={this.state.initialDataLoading} size="large" >     
          <Table
                columns={layoutColumns}
                rowKey={record => record.name}
                dataSource={this.state.fileLayout}
                pagination={{ pageSize: 10 }} 
                scroll={{ x: 1000 }}
                size="middle"
              />
        </Spin>
      </div>
      </div>:null}
      </div>
    )
  }
}
export default FileReport;