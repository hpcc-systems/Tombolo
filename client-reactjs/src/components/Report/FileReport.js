import { Table, Tooltip, Divider, message, Popconfirm, Icon, Drawer, Button } from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js"

class FileReport extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    fileList:this.props.fileList,
    openFileLayout:false,
    selectedFileId:"",
    selectedFileTitle:"",
    fileLayout: []
  }

  componentDidMount() {    
    
  }

  componentWillReceiveProps(props) {
    this.setState({
      fileList: props.fileList
      });
      if(props.refresh){
        this.setState({
          openFileLayout:false
          });
      }
  }

  fileSelect = (id,title,name) => {
    this.setState({
      selectedFileId:id,
      selectedFileTitle:(title)?title:name,
      openFileLayout: true
      });
      this.fetchDataAndRenderTable(id);
  }
  fetchDataAndRenderTable(val) {
    var _self=this;
    fetch("/api/report/read/fileLayout?file_id="+val, {
        headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {     
      this.setState({
        fileLayout: data
      });
      window.scrollTo({ top: 400, behavior: 'smooth'})
    }).catch(error => {
      console.log(error);
    });
  }
  render() {
    const indexColumns = [{
      title: 'Title',
      dataIndex: 'title',
      width: '20%',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.fileSelect(record.id,record.title,record.name)}>{text}</a>
        </span>
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
      <div >
          <Table
                columns={layoutColumns}
                rowKey={record => record.name}
                dataSource={this.state.fileLayout}
                pagination={{ pageSize: 10 }} 
                scroll={{ x: 1000 }}
                size="middle"
              />
      </div>
      </div>:null}
      </div>
    )
  }
}
export default FileReport;