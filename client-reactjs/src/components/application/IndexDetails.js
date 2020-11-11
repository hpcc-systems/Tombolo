import React, { Component } from "react";
import { Modal, Tabs, Form, Input, Icon, Select, Table, AutoComplete, message, Spin, Button } from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { hasEditPermission } from "../common/AuthUtil.js";
import { fetchDataDictionary, eclTypes } from "../common/CommonUtil.js"
import {omitDeep} from '../common/CommonUtil.js';
import AssociatedDataflows from "./AssociatedDataflows"
import EditableTable from "../common/EditableTable.js"
import { MarkdownEditor } from "../common/MarkdownEditor.js"

const TabPane = Tabs.TabPane;
const Option = Select.Option;
const { confirm } = Modal;

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
    indexSearchErrorShown:false,
    autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />,
    dataDefinitions:[],
    index: {
      id:"",
      title:"",
      name:"",
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
    this.props.onRef(this);
    this.getIndexDetails();
    this.fetchDataDefinitions();
  }

  getIndexDetails() {
    if(this.props.selectedAsset && !this.props.isNew) {
      fetch("/api/index/read/index_details?index_id="+this.props.selectedAsset+"&app_id="+this.props.applicationId, {
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
          index: {
            ...this.state.index,
            id: data.basic.id,
            title: data.basic.title == '' ? data.basic.name : data.basic.title,
            name: (data.basic.name == '' ? data.basic.title : data.basic.name),
            description: data.basic.description,
            primaryService: data.basic.primaryService,
            backupService: data.basic.backupService,
            keyedColumns: data.basic.index_keys,
            nonKeyedColumns: data.basic.index_payloads
          }
        });
        this.props.form.setFieldsValue({
          title: data.basic.title,
          name: (data.basic.name == '' ? data.basic.title : data.basic.name),
          description: data.basic.description,
          primaryService: data.basic.primaryService,
          backupService: data.basic.backupService,
          keyedColumns: data.basic.index_keys,
          nonKeyedColumns: data.basic.index_payloads,
          path: data.basic.qualifiedPath
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
    //if(this.props.isNew) {
      this.getClusters();
    //}
  }

  handleOk = (e) => {
    this.props.form.validateFields(async (err, values) => {
      if(!err) {
        this.setState({
          confirmLoading: true,
        });

        let saveResponse = await this.saveIndexDetails();

        setTimeout(() => {
          this.setState({
            visible: false,
            confirmLoading: false,
          });
          this.props.onClose();
          this.props.onRefresh(saveResponse);
        }, 200);
      }
    });
  }

  handleDelete = () => {
    let _self=this;
    confirm({
      title: 'Delete Index?',
      content: 'Are you sure you want to delete this Index?',
      onOk() {
        var data = JSON.stringify({indexId: _self.props.selectedAsset, application_id: _self.props.applicationId});
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
          if(_self.props.onDelete) {
            _self.props.onDelete(_self.props.currentlyEditingNode);
          } else {
            _self.props.onRefresh();
          }
          _self.props.onClose();
          message.success("Index deleted sucessfully");
        }).catch(error => {
          console.log(error);
          message.error("There was an error deleting the Index file");
        });
      },
      onCancel() {},
    })
  }

  async fetchDataDefinitions() {
    try {
      let dataDefn = await fetchDataDictionary(this.props.applicationId);
      this.setState({
        dataDefinitions: dataDefn
      });
    } catch (err) {
      console.log(err)
    }
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
    this.setState({
      ...this.state,
      autoCompleteSuffix : <Spin/>,
      indexSearchErrorShown: false
    });

    var data = JSON.stringify({clusterid: this.state.selectedCluster, keyword: searchString, indexSearch:true});
    fetch("/api/hpcc/read/filesearch", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      } else {
        throw response;
      }
      handleError(response);
    })
    .then(suggestions => {
      this.setState({
        ...this.state,
        fileSearchSuggestions: suggestions,
        autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />
      });
    }).catch(error => {
      if(!this.state.indexSearchErrorShown) {
        error.json().then((body) => {
          message.config({top:130})
          message.error(body.message);
        });
        this.setState({
          ...this.state,
          indexSearchErrorShown: true,
          autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />
        });
      }
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
        index: {
          ...this.state.index,
          id: indexInfo.name,
          title: indexInfo.fileName,
          name: indexInfo.fileName,
          description: indexInfo.description,
          path: indexInfo.pathMask,
          keyedColumns: indexInfo.columns.keyedColumns,
          nonKeyedColumns: indexInfo.columns.nonKeyedColumns
        }
      })
      this.props.form.setFieldsValue({
        name: indexInfo.fileName,
        title: indexInfo.fileName
      });
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

  saveIndexDetails() {
    return new Promise((resolve) => {
      fetch('/api/index/read/saveIndex', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({isNew : this.props.isNew, id: this.state.index.id, index : this.populateIndexDetails()})
      }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      }).then(function(data) {
        console.log('Saved..');
        resolve(data);
      });
      //this.populateIndexDetails()
    });
  }

  setIndexFieldData = (data) => {
    let omitResults = omitDeep(data, 'id')
    this.setState({
      ...this.state,
      index: {
        ...this.state.index,
        keyedColumns: omitResults
      }
    })
  }

  setNonKeyedColumnData = (data) => {
    console.log('setNonKeyedColumnData..'+JSON.stringify(data))
    let omitResults = omitDeep(data, 'id')
    this.setState({
      ...this.state,
      index: {
        ...this.state.index,
        nonKeyedColumns: omitResults
      }
    })
  }

  populateIndexDetails() {
    var applicationId = this.props.applicationId;
    var indexDetails = {"app_id":applicationId};
    var index_basic = {
      //"id" : this.state.file.id,
      "title" : this.state.index.title,
      "name" : this.state.index.name,
      "description" : this.state.index.description,
      "primaryService" : this.state.index.primaryService,
      "backupService" : this.state.index.backupService,
      "qualifiedPath" : this.state.index.path,
      "application_id" : applicationId,
      "dataflowId" : this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
      "parentFileId" : this.state.selectedSourceFile
    };
    indexDetails.basic = index_basic;

    indexDetails.indexKey = this.state.index.keyedColumns;
    //indexDetails.indexKey = this.indexFieldsTable.getData();

    indexDetails.indexPayload = this.state.index.nonKeyedColumns;

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
    this.setState({...this.state, index: {...this.state.index, [e.target.name]: e.target.value }});
  }

  onSourceFileSelection = (value) => {
    this.setState({
      selectedSourceFile: value,
    });
  }

  render() {
    const editingAllowed = hasEditPermission(this.props.user);
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
      dataIndex: 'name',
      editable: editingAllowed,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      editable: editingAllowed,
      celleditor: "select",
      showdatadefinitioninfield: true,
      celleditorparams: {
        values: eclTypes.sort()
      }
    }
    ];


    const {name, title, description, primaryService, backupService, path, relations, keyedColumns, nonKeyedColumns} = this.state.index;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectedRowKeysChange
    };

    //render only after fetching the data from the server
    if(!title && !this.props.selectedAsset && !this.props.isNew) {
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
          destroyOnClose={true}
          width="1200px"
          footer={[
            <Button key="danger" type="danger" onClick={this.handleDelete}>Delete</Button>,
            <Button key="back" onClick={this.handleCancel}>
              Cancel
            </Button>,
            <Button key="submit" disabled={!editingAllowed} type="primary" loading={confirmLoading} onClick={this.handleOk}>
              Save
            </Button>,
          ]}
        >
        <Tabs
          defaultActiveKey="1"
        >
          <TabPane tab="Basic" key="1">

           <Form layout="vertical">
            {/*{this.props.isNew ?*/}
            <div>
            <Form.Item {...formItemLayout} label="Cluster">
               <Select placeholder="Select a Cluster" onChange={this.onClusterSelection} style={{ width: 190 }} disabled={!editingAllowed}>
                {clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
              </Select>
            </Form.Item>

            <Form.Item {...formItemLayout} label="Index">
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
                disabled={!editingAllowed}
              >
                <Input id="autocomplete_field" suffix={this.state.autoCompleteSuffix} autoComplete="off"/>
              </AutoComplete>
            </Form.Item>
            </div>

            <Form.Item {...formItemLayout} label="Name">
                {getFieldDecorator('name', {
                  rules: [{ required: true, message: 'Please enter a name!' }],
                })(
                <Input id="name" name="name" onChange={this.onChange} placeholder="Name" disabled={true} disabled={!editingAllowed}/>)}
            </Form.Item>

            <Form.Item {...formItemLayout} label="Title">
              {getFieldDecorator('title')
              (<Input id="file_title" name="title" onChange={this.onChange} placeholder="Title" disabled={!editingAllowed}/>)}
            </Form.Item>
            <Form.Item {...formItemLayout} label="Description">
              {getFieldDecorator('description')
              (<MarkdownEditor id="index_desc" name="description" onChange={this.onChange} targetDomId="indexDescr" value={description} disabled={!editingAllowed}/>)}
            </Form.Item>
            <Form.Item {...formItemLayout} label="Primary Service">
              {getFieldDecorator('primaryService')
               (<Input id="file_primary_svc" name="primaryService" onChange={this.onChange} placeholder="Primary Service" disabled={!editingAllowed}/>)}
            </Form.Item>
            <Form.Item {...formItemLayout} label="Backup Service">
              {getFieldDecorator('backupService')
              (<Input id="file_bkp_svc" name="backupService" onChange={this.onChange} placeholder="Backup Service" disabled={!editingAllowed}/>)}
            </Form.Item>
            <Form.Item {...formItemLayout} label="Path">
              {getFieldDecorator('path')
              (<Input id="path" name="path" onChange={this.onChange} placeholder="Path" disabled={!editingAllowed}/>)}
            </Form.Item>
          </Form>

          </TabPane>
          <TabPane tab="Source File" key="2">
            <div>
               <Select placeholder="Select Source Files" defaultValue={this.state.selectedSourceFile} style={{ width: 190 }} onSelect={this.onSourceFileSelection} disabled={!editingAllowed}>
                {sourceFiles.map(d => <Option key={d.id}>{(d.title)?d.title:d.name}</Option>)}
              </Select>
              </div>
          </TabPane>
          <TabPane tab="Index" key="3">


              <EditableTable
                columns={indexColumns}
                dataSource={keyedColumns}
                editingAllowed={editingAllowed}
                dataDefinitions={this.state.dataDefinitions}
                showDataDefinition={true}
                setData={this.setIndexFieldData}/>


          </TabPane>
          <TabPane tab="Payload" key="4">
              <EditableTable
                columns={indexColumns}
                dataSource={nonKeyedColumns}
                editingAllowed={editingAllowed}
                dataDefinitions={this.state.dataDefinitions}
                showDataDefinition={true}
                setData={this.setNonKeyedColumnData}/>
          </TabPane>

          {!this.props.isNew ?
            <TabPane tab="Dataflows" key="7">
              <AssociatedDataflows assetName={name} assetType={'Index'}/>
            </TabPane> : null}
        </Tabs>
        </Modal>
      </div>
    );
  }
}
const IndexDetailsForm = Form.create()(IndexDetails);
export default IndexDetailsForm;