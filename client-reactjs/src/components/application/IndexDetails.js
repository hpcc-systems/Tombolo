import React, { Component } from "react";
import { Modal, Tabs, Form, Input, Icon, Select, Table, AutoComplete } from 'antd/lib';
import "react-table/react-table.css";
import { authHeader, handleError } from "../common/AuthHeader.js"

const TabPane = Tabs.TabPane;
const Option = Select.Option;

class IndexDetails extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    visible: true,
    confirmLoading: false,
    pagination: {},
    loading: false,
    sourceFiles:[],
    selectedSourceFile:"",
    availableLicenses:[],
    selectedRowKeys:[],
    clusters:[],
    selectedCluster:"",
    fileSearchSuggestions:[],
    file: {
      id:"",
      title:"",
      description:"",
      primaryService:"",
      backupService:"",
      path:"",
      keyedColumns:[],
      nonKeyedColumns:[],
      relations:[]
    }
  }

  componentDidMount() {
    //this.props.onRef(this);
    this.getIndexDetails();
  }

  getIndexDetails() {
    if(this.props.selectedIndex && !this.props.isNewIndex) {
      fetch("/api/index/read/index_details?index_id="+this.props.selectedIndex+"&app_id="+this.props.applicationId, {
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
          ...this.state,
          selectedSourceFile: data.basic.parentFileId,
          file: {
            ...this.state.file,
            id: data.basic.id,
            title: data.basic.title,
            description: data.basic.description,
            primaryService: data.basic.primaryService,
            backupService: data.basic.backupService,
            keyedColumns: data.basic.index_keys,
            nonKeyedColumns: data.basic.index_payloads
          }
        });
        return data;
      })
      .then(data => {
        this.getFiles();
      })
      .catch(error => {
        console.log(error);
      });
    } else {
      this.getClusters();
    }
  }

  showModal = () => {
    this.setState({
      visible: true,
    });
    this.getIndexDetails();
    if(this.props.isNewFile) {
      this.getClusters();
    }
  }

  handleOk = () => {
    this.setState({
      confirmLoading: true,
    });

    this.saveFileDetails();

    setTimeout(() => {
      this.setState({
        visible: false,
        confirmLoading: false,
      });
      this.props.onClose();
      this.props.onRefresh();
    }, 2000);
  }

  getClusters() {
    fetch("/api/hpcc/read/getClusters", {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(clusters => {
      this.setState({
        ...this.state,
        clusters: clusters
      });
    }).catch(error => {
      console.log(error);
    });
  }

  searchIndexes(searchString) {
    if(searchString.length <= 3)
      return;
    var data = JSON.stringify({clusterid: this.state.selectedCluster, keyword: searchString, indexSearch:true});
    fetch("/api/hpcc/read/filesearch", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(suggestions => {
      this.setState({
        ...this.state,
        fileSearchSuggestions: suggestions
      });
    }).catch(error => {
      console.log(error);
    });
  }

  onFileSelected(selectedSuggestion) {
    fetch("/api/hpcc/read/getIndexInfo?indexName="+selectedSuggestion+"&clusterid="+this.state.selectedCluster, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(indexInfo => {
      this.setState({
        ...this.state,
        sourceFiles: [],
        file: {
          ...this.state.file,
          id: indexInfo.name,
          title: indexInfo.fileName,
          description: indexInfo.description,
          path: indexInfo.pathMask,
          keyedColumns: indexInfo.columns.keyedColumns,
          nonKeyedColumns: indexInfo.columns.nonKeyedColumns
        }
      })
      return indexInfo;
    })
    .then(data => {
      this.getFiles();
    })
    .catch(error => {
      console.log(error);
    });
  }

  getFiles() {
    fetch("/api/file/read/file_ids?app_id="+this.props.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(files => {
      this.setState({
        ...this.state,
        sourceFiles: files
      });
    }).catch(error => {
      console.log(error);
    });
  }

  getFieldNames(layout) {
    var fields = [];
    layout.forEach(function (item, idx) {
      fields.push({"field":item.name, "source_field":"", "requirements": ""});
    });
    return fields;
  }

  saveFileDetails() {
    fetch('/api/index/read/saveIndex', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({index : this.populateFileDetails()})
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      console.log('Saved..');
    });
    //this.populateFileDetails()
  }

  populateFileDetails() {
    var applicationId = this.props.applicationId;
    var indexDetails = {"app_id":applicationId};
    var index_basic = {
      "id" : this.state.file.id,
      "title" : this.state.file.title,
      "description" : this.state.file.description,
      "primaryService" : this.state.file.primaryService,
      "backupService" : this.state.file.backupService,
      "qualifiedPath" : this.state.file.path,
      "application_id" : applicationId,
      "parentFileId" : this.state.selectedSourceFile
    };
    indexDetails.basic = index_basic;

    indexDetails.indexKey = this.state.file.keyedColumns;

    indexDetails.indexPayload = this.state.file.nonKeyedColumns;

    console.log(indexDetails);

    return indexDetails;
  }

  handleCancel = () => {
    this.setState({
      visible: false,
    });
    this.props.onClose();

  }

  onClusterSelection = (value) => {
    this.setState({
      selectedCluster: value,
    });
  }

  onChange = (e) => {
    this.setState({...this.state, file: {...this.state.file, [e.target.name]: e.target.value }});
  }

  onSourceFileSelection = (value) => {
    this.setState({
      selectedSourceFile: value,
    });
  }

  render() {
    const {
      getFieldDecorator, getFieldsError, getFieldError, isFieldTouched,
    } = this.props.form;
    const { visible, confirmLoading, sourceFiles, availableLicenses, selectedRowKeys, clusters, fileSearchSuggestions } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 5 },
      },
      wrapperCol: {
        xs: { span: 2 },
        sm: { span: 10 },
      },
    };

    const indexColumns = [{
      title: 'Name',
      dataIndex: 'ColumnLabel',
      width: '20%',
    },
    {
      title: 'Type',
      dataIndex: 'ColumnType'
    }];


    const {title, description, primaryService, backupService, path, relations, keyedColumns, nonKeyedColumns} = this.state.file;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectedRowKeysChange
    };
    //render only after fetching the data from the server
    if(!title && !this.props.selectedIndex && !this.props.isNewFile) {
      return null;
    }

    return (
      <div>
        <Modal
          title="Index Details"
          visible={visible}
          onOk={this.handleOk}
          confirmLoading={confirmLoading}
          onCancel={this.handleCancel}
          bodyStyle={{height:"500px"}}
          destroyOnClose={true}
          width="1200px"
        >
        <Tabs
          defaultActiveKey="1"
        >
          <TabPane tab="Basic" key="1">

           <Form layout="vertical">
            {this.props.isNewFile ?
            <div>
            <Form.Item {...formItemLayout} label="Cluster">
               <Select placeholder="Select a Cluster" onChange={this.onClusterSelection} style={{ width: 190 }}>
                {clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
              </Select>
            </Form.Item>

            <Form.Item {...formItemLayout} label="File">
              <AutoComplete
                className="certain-category-search"
                dropdownClassName="certain-category-search-dropdown"
                dropdownMatchSelectWidth={false}
                dropdownStyle={{ width: 300 }}
                size="large"
                style={{ width: '100%' }}
                dataSource={fileSearchSuggestions}
                onChange={(value) => this.searchIndexes(value)}
                onSelect={(value) => this.onFileSelected(value)}
                placeholder="Search indexes"
                optionLabelProp="value"
              >
                <Input suffix={<Icon type="search" className="certain-category-icon" />} />
              </AutoComplete>
            </Form.Item>
            </div>
              : null
            }
            <Form.Item {...formItemLayout} label="Title">
                <Input id="file_title" name="title" onChange={this.onChange} value={title} defaultValue={title} placeholder="Title" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Description">
                <Input id="file_desc" name="description" onChange={this.onChange} value={description} defaultValue={description} placeholder="Description" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Primary Service">
                <Input id="file_primary_svc" name="primaryService" onChange={this.onChange} value={primaryService} defaultValue={primaryService} placeholder="Primary Service" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Backup Service">
                <Input id="file_bkp_svc" name="backupService" onChange={this.onChange} value={backupService} defaultValue={backupService} placeholder="Backup Service" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Path">
                <Input id="path" name="path" onChange={this.onChange} value={path} defaultValue={path} placeholder="Path" />
            </Form.Item>
          </Form>

          </TabPane>
          <TabPane tab="Source File" key="2">
            <div>
               <Select placeholder="Select Source Files" defaultValue={this.state.selectedSourceFile} style={{ width: 190 }} onSelect={this.onSourceFileSelection}>
                {sourceFiles.map(d => <Option key={d.id}>{(d.title)?d.title:d.name}</Option>)}
              </Select>
              </div>
          </TabPane>
          <TabPane tab="Index" key="3">
              <Table
                columns={indexColumns}
                rowKey={record => record.columnLabel}
                dataSource={keyedColumns}
                pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
              />
          </TabPane>
          <TabPane tab="Payload" key="4">
              <Table
                columns={indexColumns}
                rowKey={record => record.columnLabel}
                dataSource={nonKeyedColumns}
                pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
              />
          </TabPane>
        </Tabs>
        </Modal>
      </div>
    );
  }
}
const IndexDetailsForm = Form.create()(IndexDetails);
export default IndexDetailsForm;
