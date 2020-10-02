//import 'treant-js/vendor/raphael.min.js';
import { Table, Tooltip, Divider, message, Popconfirm, Icon, Drawer, Button } from 'antd/lib';
import React, { Component } from "react";
import FileDetailsForm from "./FileDetails";
import FileInstanceDetailsForm from "./FileInstanceDetails";
import { authHeader, handleError } from "../common/AuthHeader.js"
import { hasEditPermission } from "../common/AuthUtil.js";
import { Constants } from '../common/Constants';

class FileTable extends Component {
  state = {
    openFileDetailsDialog: false,
    selectedFile: "",
    applicationId: this.props.applicationId,
    files: [],
    drawerVisible: false,
    fileId: '',
    showFileInstancesTable: false,
    fileInstances: []
  }

 componentDidMount() {
    this.fetchDataAndRenderTable();
  }

  componentWillReceiveProps(props) {
    this.setState({
        applicationId: props.applicationId
      });
    const { refresh } = this.props;
    if (props.refresh !== refresh) {
      setTimeout(() => {
        this.fetchDataAndRenderTable();
      }, 200);

    }
  }

  fetchDataAndRenderTable() {
    var _self=this;
    fetch("/api/file/read/file_list?app_id="+this.state.applicationId, {
        headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      var results = [];
      data.forEach(function(doc, idx) {
        var fileObj = {};
        fileObj=doc;
        fileObj.fileTitle=(doc.title)?doc.title:doc.name;
        results.push(fileObj);
      });
      this.setState({
        files: results
      });
      this.setState({
        openFileDetailsDialog: false
      });
    }).catch(error => {
      console.log(error);
    });
    //this._setupListeners();
  }

  handleEdit = (fileId) => {
    this.setState({
      openFileDetailsDialog: true,
      selectedFile: fileId
    });
    //this.child.showModal();
  }

  handleDelete= (fileId) => {
    console.log(fileId);
    var data = JSON.stringify({fileId: fileId, application_id: this.state.applicationId});
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
      this.fetchDataAndRenderTable();
      message.success("File deleted sucessfully");
    }).catch(error => {
      console.log(error);
      message.error("There was an error deleting the file");
    });
  }

  handleClose = () => {
    console.log('handleClose')
    this.setState({
      openFileDetailsDialog: false
    });
  }

  onDrawerClose = () => {
    this.setState({
      drawerVisible: false,
    });
  }

  onDrawerOpen = (fileId) => {
    this.setState({
        fileId: fileId,
      });

    this.setState({
      drawerVisible: true,
    });
  }

  handleBackClick = () => {
    this.setState({
      showFileInstancesTable: false,
    });
  }

  showFileinstances = (fileId) => {
    fetch("/api/fileinstance/instances?file_def="+fileId, {
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
        fileInstances: data,
        showFileInstancesTable: true
      });
    }).catch(error => {
      console.log(error);
    });
  }

  showFiles = () => {
    this.setState({
      showFileInstancesTable: false
    });

  }

  handleRefreshTree = () => this.fetchDataAndRenderTable();

  onViewFileInstanceDetails = (id) => {
    this.instanceDetailsForm.showInstanceDetails(id);
  }

  render() {
    const editingAllowed = hasEditPermission(this.props.user);
    const {showFileInstancesTable} = this.state;
    const indexColumns = [{
      title: 'Name',
      dataIndex: 'fileTitle',
      width: '20%',
      render: (text, record) => <a href='#' onClick={(row) => this.handleEdit(record.id)}>{text}</a>
    },
    {
        width: '20%',
        title: 'Description',
        dataIndex: 'description'
    },
    {
        width: '10%',
        title: 'File Type',
        dataIndex: 'fileType'
    },
    {
        width: '10%',
        title: 'Source',
        dataIndex: 'supplier'
    },
    {
        width: '10%',
        title: 'Dataflow',
        render: (text, record) => {
          return (record.dataflow && record.dataflow.title != '') ? record.dataflow.title : '';
        }
    },
    {
        width: '25%',
        title: 'Created',
        dataIndex: 'createdAt',
        render: (text, record) => {
          let createdAt = new Date(text);
          return createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ createdAt.toLocaleTimeString('en-US') 
        }
    },
    {
      width: '10%',
      title: 'Action',
      dataIndex: '',
      className: editingAllowed ? 'show-column' : 'hide-column',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.handleEdit(record.id)}><Tooltip placement="right" title={"Edit File"}><Icon type="edit" /></Tooltip></a>
          <Divider type="vertical" />
          <Popconfirm title="Are you sure you want to delete this File?" onConfirm={() => this.handleDelete(record.id)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
            <a href="#"><Tooltip placement="right" title={"Delete File"}><Icon type="delete" /></Tooltip></a>
          </Popconfirm>
        </span>
    }];

    const fileInstanceColumns = [{
      title: 'Name',
      dataIndex: 'item_name',
      width: '35%',
    },
    {
        width: '10%',
        title: 'Source',
        dataIndex: 'source_name'
    },
    ,
    {
        width: '10%',
        title: 'Customer',
        dataIndex: 'customer_name'
    },
    {
        width: '20%',
        title: 'Received Date',
        dataIndex: 'receive_date'
    },
    {
      width: '35%',
      title: 'Action',
      dataIndex: '',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.onViewFileInstanceDetails(record.id)}><Tooltip placement="right" title={"View Details"}><Icon type="eye"/></Tooltip></a>
        </span>
    }]
    let table = null;
    if(showFileInstancesTable) {
      table = <Table
      columns={fileInstanceColumns}
      rowKey={record => record.id}
      dataSource={this.state.fileInstances}
      pagination={{ pageSize: 20 }}
      title={() => <Button type="primary" onClick={this.handleBackClick}><Icon type="rollback" />File Defintions</Button>}
    />
    } else {
      table = <Table
      columns={indexColumns}
      rowKey={record => record.id}
      dataSource={this.state.files}
      pagination={{ pageSize: 20 }} 
      scroll={{ y: '70vh' }}
    />

    }
    return (
      <div>
        <Drawer
            title="File Relation"
            placement="right"
            closable={true}
            destroyOnClose={true}
            onClose={this.onDrawerClose}
            visible={this.state.drawerVisible}
            width={720}
            style={{
            overflow: 'auto',
            paddingBottom: '108px',
            }}
        >
        </Drawer>
        {table}
        {this.state.openFileDetailsDialog ?
            <FileDetailsForm
            onRef={ref => (this.child = ref)}
            isNew={false}
            selectedAsset={this.state.selectedFile}
            applicationId={this.props.applicationId}
            onClose={this.handleClose}
            onRefresh={this.handleRefreshTree}
            user={this.props.user}/> : null}

        <FileInstanceDetailsForm onRef={ref => this.instanceDetailsForm = ref}/>
      </div>
    )
  }
}

export default FileTable;