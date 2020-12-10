import {Treant} from 'treant-js/Treant.js';
//import 'treant-js/vendor/raphael.min.js';
import { Table, Divider, message, Popconfirm, Tooltip } from 'antd/lib';
import React, { Component } from "react";
import IndexDetailsForm from "./IndexDetails";
import { authHeader, handleError } from "../common/AuthHeader.js"
import { Constants } from '../common/Constants';
import ReactMarkdown from 'react-markdown';
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined, ShareAltOutlined  } from '@ant-design/icons';

class IndexTree extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    applications: [],
    openFileDetailsDialog: false,
    selectedFile: "",
    applicationId: this.props.applicationId,
    indexes: []

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
    fetch("/api/index/read/index_list?app_id="+this.state.applicationId, {
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
        indexes: data
      });
    }).catch(error => {
      console.log(error);
    });
    //this._setupListeners();
  }

  handleEdit(fileId) {
    this.setState({
      openFileDetailsDialog: true,
      selectedFile: fileId
    });
    //this.child.showModal();
  }

  handleDelete(indexId) {
    console.log(indexId);
    var data = JSON.stringify({indexId: indexId, application_id: this.state.applicationId});
    fetch("/api/index/read/delete", {
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
      message.success("Index deleted sucessfully");
    }).catch(error => {
      console.log(error);
      message.error("There was an error deleting the Index file");
    });
  }

  handleClose = () => {
    console.log('handleClose')
    this.setState({
      openFileDetailsDialog: false
    });
  }

  handleRefreshTree = () => this.fetchDataAndRenderTable();

  render() {
    const indexColumns = [{
      title: 'Name',
      dataIndex: 'title',
      width: '20%',
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
      width: '10%',
      title: 'Source File',
      dataIndex: 'file.title'
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
      width: '15%',
      title: 'Action',
      dataIndex: '',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.handleEdit(record.id)}><Tooltip placement="right" title={"Edit Index"}><EditOutlined/></Tooltip></a>
          <Divider type="vertical" />
          <Popconfirm title="Are you sure you want to delete this Index?" onConfirm={() => this.handleDelete(record.id)} icon={<QuestionCircleOutlined/>}>
            <a href="#"><Tooltip placement="right" title={"Delete Index"}><DeleteOutlined/></Tooltip></a>
          </Popconfirm>
        </span>
    }];
    return (
      <div>
        <Table
            columns={indexColumns}
            rowKey={record => record.id}
            dataSource={this.state.indexes}
            pagination={{ pageSize: 10 }}
            scroll={{ y: '70vh' }}
          />
        {this.state.openFileDetailsDialog ?
          <IndexDetailsForm
            onRef={ref => (this.child = ref)}
            selectedAsset={this.state.selectedFile}
            isNew={false}
            applicationId={this.props.applicationId}
            onRefresh={this.handleRefreshTree}
            onClose={this.handleClose}
            user={this.props.user}/> : null}
      </div>
    )
  }
}

export default IndexTree;