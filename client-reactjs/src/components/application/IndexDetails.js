import React, { Component } from "react";
import { Modal, Tabs, Form, Input, Icon, Select, Table, AutoComplete, message, Spin, Button } from 'antd/lib';
import "react-table/react-table.css";
import { authHeader, handleError } from "../common/AuthHeader.js"
import { hasEditPermission } from "../common/AuthUtil.js";
import { fetchDataDictionary, eclTypes } from "../common/CommonUtil.js"
import {omitDeep} from '../common/CommonUtil.js';
import AssociatedDataflows from "./AssociatedDataflows"
import EditableTable from "../common/EditableTable.js"

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
    indexSearchErrorShown:false,
    autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />,
    dataDefinitions:[],
    file: {
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
    if(this.props.selectedAsset && !this.props.isNewFile) {
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
          file: {
            ...this.state.file,
            id: data.basic.id,
            title: data.basic.title,
            name: (data.basic.name == '' ? data.basic.title : data.basic.name),
            description: data.basic.description,
            primaryService: data.basic.primaryService,
            backupService: data.basic.backupService,
            keyedColumns: data.basic.index_keys,
            nonKeyedColumns: data.basic.index_payloads
          }
        });
        this.props.form.setFieldsValue({
          title: data.basic.title
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

        let saveResponse = await this.saveFileDetails();

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
        file: {
          ...this.state.file,
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

  saveFileDetails() {
    return new Promise((resolve) => {
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
        resolve(data);
      });
      //this.populateFileDetails()
    });
  }

  setIndexFieldData = (data) => {    
    console.log('setIndexFieldData..'+JSON.stringify(data))
    let omitResults = omitDeep(data, 'id')
    this.setState({
      ...this.state,
      file: {
        ...this.state.file,
        keyedColumns: omitResults
      }
    })
  }

  setNonKeyedColumnData = (data) => {    
    console.log('setNonKeyedColumnData..'+JSON.stringify(data))
    let omitResults = omitDeep(data, 'id')    
    this.setState({
      ...this.state,
      file: {
        ...this.state.file,
        nonKeyedColumns: omitResults
      }
    })
  }

  populateFileDetails() {
    var applicationId = this.props.applicationId;
    var indexDetails = {"app_id":applicationId};
    var index_basic = {
      //"id" : this.state.file.id,
      "title" : this.state.file.title,
      "name" : this.state.file.name,
      "description" : this.state.file.description,
      "primaryService" : this.state.file.primaryService,
      "backupService" : this.state.file.backupService,
      "qualifiedPath" : this.state.file.path,
      "application_id" : applicationId,
      "dataflowId" : this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
      "parentFileId" : this.state.selectedSourceFile
    };
    indexDetails.basic = index_basic;

    indexDetails.indexKey = this.state.file.keyedColumns;
    //indexDetails.indexKey = this.indexFieldsTable.getData();

    indexDetails.indexPayload = this.state.file.nonKeyedColumns;

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
      celleditorparams: {
        values: eclTypes.sort()
      }
    }];


    const {name, title, description, primaryService, backupService, path, relations, keyedColumns, nonKeyedColumns} = this.state.file;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectedRowKeysChange
    };

    //render only after fetching the data from the server    
    if(!title && !this.props.selectedAsset && !this.props.isNewFile) {
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
          footer={[
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
                <Input id="autocomplete_field" suffix={this.state.autoCompleteSuffix} autocomplete="off"/>
              </AutoComplete>
            </Form.Item>
            </div>
              {/*: null
            }*/}
             <Form.Item {...formItemLayout} label="Name">
                <Input id="file_name" name="name" onChange={this.onChange} value={name} defaultValue={name} placeholder="Name" disabled={true} disabled={!editingAllowed}/>
            </Form.Item>
            <Form.Item {...formItemLayout} label="Title">
                <Input id="file_title" name="title" onChange={this.onChange} value={title} defaultValue={title} placeholder="Title" disabled={!editingAllowed}/>
            </Form.Item>
            <Form.Item {...formItemLayout} label="Description">
                <Input id="file_desc" name="description" onChange={this.onChange} value={description} defaultValue={description} placeholder="Description" disabled={!editingAllowed}/>
            </Form.Item>
            <Form.Item {...formItemLayout} label="Primary Service">
                <Input id="file_primary_svc" name="primaryService" onChange={this.onChange} value={primaryService} defaultValue={primaryService} placeholder="Primary Service" disabled={!editingAllowed}/>
            </Form.Item>
            <Form.Item {...formItemLayout} label="Backup Service">
                <Input id="file_bkp_svc" name="backupService" onChange={this.onChange} value={backupService} defaultValue={backupService} placeholder="Backup Service" disabled={!editingAllowed}/>
            </Form.Item>
            <Form.Item {...formItemLayout} label="Path">
                <Input id="path" name="path" onChange={this.onChange} value={path} defaultValue={path} placeholder="Path" disabled={!editingAllowed}/>
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

          {!this.props.isNewFile ? 
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
