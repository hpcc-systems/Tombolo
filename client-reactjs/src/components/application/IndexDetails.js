import React, { PureComponent } from "react";
import {  Tabs, Form, Input, Icon, Select, Table, AutoComplete, message, Spin, Button, Row, Col } from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { hasEditPermission } from "../common/AuthUtil.js";
import { fetchDataDictionary, eclTypes } from "../common/CommonUtil.js"
import {omitDeep} from '../common/CommonUtil.js';
import AssociatedDataflows from "./AssociatedDataflows"
import EditableTable from "../common/EditableTable.js"
import { MarkdownEditor } from "../common/MarkdownEditor.js"
import { connect } from 'react-redux';
import { SearchOutlined  } from '@ant-design/icons';
import { assetsActions } from '../../redux/actions/Assets';
import { debounce } from 'lodash';
import { store } from '../../redux/store/Store';
import {Constants} from "../common/Constants"
import ReactMarkdown from 'react-markdown'
import {readOnlyMode, editableMode} from "../common/readOnlyUtil"
import DeleteAsset from "../common/DeleteAsset/index.js";



const TabPane = Tabs.TabPane;
const Option = Select.Option;
message.config({top:130})

class IndexDetails extends PureComponent {
  formRef = React.createRef();
  constructor(props) {
    super(props);
  }

  state = {
    initialDataLoading: false,
    visible: true,
    confirmLoading: false,
    sourceFiles:[],
    selectedSourceFile:"",
    clusters:[],
    selectedCluster: this.props.clusterId ? this.props.clusterId : "",
    indexSearchSuggestions:[],
    indexSearchErrorShown:false,
    indexSearchValue:'',
    searchResultsLoaded: false,
    index: {
      id:"",
      groupId: "",
      keyedColumns:[],
      nonKeyedColumns:[]
    },
    enableEdit: false,
    editing: false,
    dataAltered : false,
    errors: false
  }

  //Mounting Phase
  componentDidMount() {
    //this.props.onRef(this);
    if(this.props.application && this.props.application.applicationId) {
      this.getIndexDetails();
    }
    this.getFiles();

    //Getting global state
    const {viewOnlyModeReducer} = store.getState()
    if(viewOnlyModeReducer.addingNewAsset){
      this.setState({
        addingNewAsset : true
      })
    }
    if(viewOnlyModeReducer.editMode){
      this.setState({
        enableEdit : viewOnlyModeReducer.editMode,
        editing: true
      })
    }else{
      this.setState({
        enableEdit : viewOnlyModeReducer.editMode,

      })
    }
  }

//Unmounting phase

  //Component will unmount
  componentWillUnmount(){
    store.dispatch({
      type: Constants.ENABLE_EDIT,
      payload: false
    })

    store.dispatch({
      type:  Constants.ADD_ASSET,
      payload: false
    })
}

  getIndexDetails() {
    if(this.props.selectedAsset && !this.props.isNew) {
      this.setState({
        initialDataLoading: true
      });

      fetch("/api/index/read/index_details?index_id="+this.props.selectedAsset.id+"&app_id="+this.props.application.applicationId, {
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
          //selectedSourceFile: data.basic.parentFileId,
          initialDataLoading: false,
          index: {
            ...this.state.index,
            id: data.basic.id,
            groupId: data.basic.groupId,
            keyedColumns: data.basic.index_keys,
            nonKeyedColumns: data.basic.index_payloads,
            name: (data.basic.name == '' ? data.basic.title : data.basic.name),
            // For read only view
            description: data.basic.description,

          }
        });
        this.formRef.current.setFieldsValue({
          title: data.basic.title == '' ? data.basic.name : data.basic.title,
          name: (data.basic.name == '' ? data.basic.title : data.basic.name),
          description: data.basic.description,
          qualifiedPath: data.basic.qualifiedPath,
          primaryService: data.basic.primaryService,
          backupService: data.basic.backupService,
        })
        return data;
      })
      .catch(error => {
        console.log(error);
      });
    } else {
      this.setClusters();
    }
    this.setState({
      initialDataLoading: false
    });

  }

  showModal = () => {
    this.setState({
      visible: true,
    });
    this.getIndexDetails();
    //if(this.props.isNew) {
      this.setClusters();
    //}
  }

  handleOk = async (e) => {
    this.setState({
      confirmLoading: true,
    });

    let saveResponse = await this.saveIndexDetails();
    if(this.props.onClose) {
      this.props.onClose(saveResponse);
    }
    

    // setTimeout(() => {
      this.setState({
        visible: false,
        initialDataLoading: false,
        // confirmLoading: false
      });
      //this.props.onClose();
      //this.props.onRefresh(saveResponse);
      if(this.props.history) {
        this.props.history.push('/' + this.props.application.applicationId + '/assets')
      } else {
        document.querySelector('button.ant-modal-close').click();
      }
    // }, 200);
  };

  handleDelete = () => {
    fetch("/api/index/read/delete", {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({indexId: this.props.selectedAsset.id, application_id: this.props.application.applicationId})
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(result => {
      if(this.props.onDelete) {
        this.props.onDelete(this.props.currentlyEditingNode);
      } else {
        //this.props.onRefresh();
        this.props.history.push('/' + this.props.application.applicationId + '/assets');
      }
      //this.props.onClose();
      message.success("Index deleted successfully");
    }).catch(error => {
      console.log(error);
      message.error("There was an error deleting the Index file");
    });
  }

  setClusters() {
    let selectedCluster = this.props.clusters.filter(cluster => cluster.id == this.props.clusterId);
    if(selectedCluster.length > 0) {
      this.formRef.current.setFieldsValue({
        "clusters": selectedCluster[0].id
      })
    }
  }

  searchIndexes = debounce ((searchString) => {
    if(searchString.length <= 3 || this.state.indexSearchErrorShown)
      return;
    this.setState({
      ...this.state,
      indexSearchErrorShown: false,
      searchResultsLoaded: false
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
        indexSearchSuggestions: suggestions,
        searchResultsLoaded: true
      });
    }).catch(error => {
      if(!this.state.indexSearchErrorShown) {
        error.json().then((body) => {
          message.config({top:130})
          message.error("There was an error searching the indexes from cluster.");
        });
        this.setState({
          ...this.state,
          indexSearchErrorShown: true
        });
      }
    });
  }, 100)

  onFileSelected(selectedSuggestion) {
    message.config({top:150});
    fetch("/api/hpcc/read/getIndexInfo?indexName="+selectedSuggestion+"&clusterid="+this.state.selectedCluster+"&applicationId="+this.props.application.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(indexInfo => {
      if(indexInfo && indexInfo.basic.groups) {
        if(indexInfo.basic.groups.filter(group => group.id == this.props.groupId).length > 0) {
          message.error("There is already an index with the same name in this Group. Please select another index")
          return;
        }
      }

      this.setState({
        ...this.state,
        sourceFiles: [],
        index: {
          ...this.state.index,
          id: indexInfo.basic.id,
          keyedColumns: indexInfo.basic.index_keys,
          nonKeyedColumns: indexInfo.basic.index_payloads
        }
      })
      this.formRef.current.setFieldsValue({
        title: indexInfo.basic.title == '' ? indexInfo.basic.name : indexInfo.basic.title,
        name: (indexInfo.basic.name == '' ? indexInfo.basic.title : indexInfo.basic.name),
        description: indexInfo.basic.description,
        qualifiedPath: indexInfo.basic.qualifiedPath,
        primaryService: indexInfo.basic.primaryService,
        backupService: indexInfo.basic.backupService,
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
    fetch("/api/file/read/file_ids?app_id="+this.props.application.applicationId, {
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
      this.setState({
        initialDataLoading: true
      });

      fetch('/api/index/read/saveIndex', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({isNew : this.props.isNew, id: this.state.index.id, index : this.populateIndexDetails()})
      }).then(function(response) {
        if(response.ok) {
          message.success("Data saved")
          return response.json();
        }
        handleError(response);
      }).then(function(data) {
        console.log('Saved..');
        resolve(data);
      }).catch(error => {
        message.error("Error occured while saving the data. Please check the form data")
      }).finally(() => {
        this.setState({confirmLoading : false})
      })
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
    var applicationId = this.props.application.applicationId;
    var indexDetails = {"app_id":applicationId};
    var index_basic = {
      //"id" : this.state.file.id,
      ...this.formRef.current.getFieldsValue(),
      "application_id" : applicationId,
      "dataflowId" : this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
      "parentFileId" : this.state.selectedSourceFile,
    };
    let groupId = this.props.groupId ? this.props.groupId : this.state.index.groupId;
    if(groupId) {
      index_basic.groupId = groupId;
    }

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
    //this.props.onClose();
    if(this.props.history) {
      this.props.history.push('/' + this.props.application.applicationId + '/assets')
    } else {
      document.querySelector('button.ant-modal-close').click();
    }
  }

  onClusterSelection = (value) => {
    this.props.dispatch(assetsActions.clusterSelected(value));
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

  onReset = () => {
    this.setState({
      ...this.state,
      indexSearchValue: '',
      searchResultsLoaded: false,
      index: {
        ...this.state.index,
        id: '',
        keyedColumns: [],
        nonKeyedColumns: []
      }
    })
    this.formRef.current.resetFields();
  }

  render() {
    const editingAllowed = hasEditPermission(this.props.user);
    const { visible, sourceFiles, selectedRowKeys, clusters, indexSearchSuggestions, indexSearchValue, searchResultsLoaded, confirmLoading } = this.state;
    const formItemLayout = {
      labelCol: { span: 2 },
      wrapperCol: { span: 8 }
    };

    const indexColumns = [{
      title: 'Name',
      dataIndex: 'name',
      editable: editingAllowed,
      celleditor: "text",
      regEx: /^[a-zA-Z0-9.,:;()?!""@&#*/'$_ -]*$/      
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


    const {
      name, title, description, primaryService, backupService, path,
      keyedColumns, nonKeyedColumns
    } = this.state.index;
    const selectedCluster = clusters.filter(cluster => cluster.id == this.props.clusterId);

    //render only after fetching the data from the server
    if(!title && !this.props.selectedAsset && !this.props.isNew) {
      return null;
    }

      //Function to make fields editable
      const makeFieldsEditable = () => {
        // editableMode();

        this.setState({
          enableEdit: !this.state.enableEdit,
          editing: true
        });
      };

      //Switch to view only mode
      const switchToViewOnly = () => {
        // readOnlyMode()

        this.setState({
          enableEdit: !this.state.enableEdit,
          editing: false,
          dataAltered: true
        });
      }

     //Controls
     let controls = <div className={this.props.displayingInModal ? "assetDetail-buttons-wrapper-modal" : "assetDetail-buttons-wrapper"} style={{justifyContent: "flex-end"}} >
      {!this.state.enableEdit && editingAllowed ?  <Button  onClick={makeFieldsEditable} type="primary"> Edit  </Button> :  null}
      {this.state.editing ?  <Button  onClick={switchToViewOnly} > View Changes </Button> : null}
      {this.state.enableEdit ?
        <span className="button-container" >

             <DeleteAsset
              asset={{
                id: this.state.index.id,
                type: 'Index',
                title: this.formRef.current.getFieldValue('title') || this.formRef.current.getFieldValue('name')
              }}
              style={{ display: 'inline-block' }}
              onDelete={this.handleDelete}
              component={<Button key="danger" type="danger" disabled={!this.state.index.id || !editingAllowed}>Delete</Button>}
            />
          
          <span style={{ marginLeft: "25px"}}>
            <Button key="back" onClick={this.handleCancel} type="primary" ghost>
              Cancel
            </Button>
            <Button key="submit" disabled={!editingAllowed || this.state.errors} type="primary" loading={confirmLoading} onClick={this.handleOk} style={{background: 'var(--success)'}}>
              Save
            </Button>
          </span>
        </span> :
          <span>
            {this.state.dataAltered ?
              <span className="button-container">
              <Button key="back" onClick={this.handleCancel} type="primary" ghost>
                Cancel
              </Button>
              <Button key="submit" disabled={!editingAllowed || this.state.errors} type="primary" loading={confirmLoading} onClick={this.handleOk} style={{background: 'var(--success)'}}>
              Save
            </Button>
          </span>
            :
            <span className="button-container">
            <Button key="back" onClick={this.handleCancel} type="primary" ghost>
              Cancel
            </Button>
            </span>
        }
      </span>
        }
      </div>

       //When input input field value is changed
      const onFieldsChange = (changedFields, allFields) => {
        this.setState({dataAltered : true})
        const inputErrors = allFields.filter(item => { return item.errors.length > 0} )
        if(inputErrors.length > 0){
          this.setState({errors : true})
        }else{
          this.setState({errors: false})
        }
        }


    return (
      <React.Fragment>
         {this.props.displayingInModal || this.state.addingNewAsset ? null : 
          <div className="assetTitle"> 
              Index :  {this.state.index.name}
          </div>
        }
        <div className={this.props.displayingInModal ? "assetDetails-content-wrapper-modal" : "assetDetails-content-wrapper"}>
          {!this.props.isNew ?
            <div className="loader">
              <Spin spinning={this.state.initialDataLoading} size="large" />
            </div> : null}

          <Tabs
            defaultActiveKey="1"
            tabBarExtraContent = {this.props.displayingInModal ? null : controls}
          >
            <TabPane tab="Basic" key="1">

             <Form {...formItemLayout} labelAlign="left" ref={this.formRef} onFinish={this.handleOk} onFieldsChange={onFieldsChange}>

                 {this.state.enableEdit?
              <div>
                {this.state.addingNewAsset ?
                <>
              <Form.Item {...formItemLayout} label="Cluster" name="clusters">
                <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={this.onClusterSelection} style={{ width: 190 }}>
                  {this.props.clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
                </Select>
              </Form.Item>

              <Form.Item label="Index" name="indexSearchValue">

                <Row type="flex">
                  <Col span={21} order={1}>
                    <AutoComplete
                      className="certain-category-search"
                      dropdownClassName="certain-category-search-dropdown"
                      dropdownMatchSelectWidth={false}
                      dropdownStyle={{ width: 300 }}
                      style={{ width: '100%' }}
                      onSearch={(value) => this.searchIndexes(value)}
                      onSelect={(value) => this.onFileSelected(value)}
                      placeholder="Search indexes"
                      disabled={!editingAllowed}
                      notFoundContent={searchResultsLoaded ? 'Not Found' : <Spin />}
                    >
                      {indexSearchSuggestions.map((suggestion) => (
                        <Option key={suggestion.text} value={suggestion.value}>
                          {suggestion.text}
                        </Option>
                      ))}
                    </AutoComplete>
                  </Col>
                  <Col span={3} order={2} style={{"paddingLeft": "3px"}}>
                   <Button htmlType="button" onClick={this.onReset}>
                      Clear
                   </Button>
                  </Col>
                </Row>

              </Form.Item>
              </>
              : null }
              </div>
              : null}
              <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter a Name!' }, {
                  pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
                  message: 'Please enter a valid name',
                }]}>
                <Input id="name"
                 onChange={this.onChange}
                 disabled={!editingAllowed}
                 placeholder="Name" disabled={searchResultsLoaded || !editingAllowed}
                 className={this.state.enableEdit ? null : "read-only-input"}

                 />
              </Form.Item>

              <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter a title!' }, {
                  pattern: new RegExp(/^[ a-zA-Z0-9:._-]*$/),
                  message: 'Please enter a valid Title. Title can have  a-zA-Z0-9:._- and space',
                }]}>
                <Input id="file_title"
                onChange={this.onChange}
                placeholder="Title"
                disabled={!editingAllowed}
                className={this.state.enableEdit ? null : "read-only-input"}
                />

              </Form.Item>

              <Form.Item label="Description" name="description">
                {this.state.enableEdit ?
                <MarkdownEditor
                 id="query_desc"
                 name="description"
                  onChange={this.onChange}
                   targetDomId="indexDescr"
                    disabled={!editingAllowed}/>
                :
                <div className="read-only-markdown">   <ReactMarkdown source={this.state.index.description} /></div>
                }
              </Form.Item>

              <Form.Item label="Primary Service" name="primaryService" rules={[{
                pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                message: 'Please enter a valid Path',
              }]}>
                 <Input id="file_primary_svc"
                 onChange={this.onChange}
                 placeholder="Primary Service"
                  disabled={!editingAllowed}
                  className={this.state.enableEdit ? null : "read-only-input"}
                  />
              </Form.Item>
              <Form.Item label="Backup Service" name="backupService" rules={[{
                pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                message: 'Please enter a valid backup service',
              }]}>
                <Input id="file_bkp_svc"
                 onChange={this.onChange}
                  placeholder="Backup Service"
                   disabled={!editingAllowed}
                   className={this.state.enableEdit ? null : "read-only-input"}
                   />
              </Form.Item>
              <Form.Item label="Path" name="qualifiedPath" rules={[{
                pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                message: 'Please enter a valid path',
              }]}>
                {this.state.enableEdit ?
                <Input id="path"
                onChange={this.onChange}
                 placeholder="Path"
                 disabled={!editingAllowed}
               /> :
               <textarea className="read-only-textarea" /> }
              </Form.Item>
            </Form>

            </TabPane>
            <TabPane tab="Source File" key="2">
              {!this.state.enableEdit ? null:
              <div>
                 <Select placeholder="Select Source Files" defaultValue={this.state.selectedSourceFile} style={{ width: 190 }} onSelect={this.onSourceFileSelection} disabled={!editingAllowed}>
                  {sourceFiles.map(d => <Option key={d.id}>{(d.title)?d.title:d.name}</Option>)}
                </Select>
                </div>
  }
            </TabPane>
            <TabPane tab="Index" key="3">
              <EditableTable
                columns={indexColumns}
                dataSource={keyedColumns}
                editingAllowed={editingAllowed}
                dataDefinitions={[]}
                showDataDefinition={false}
                setData={this.setIndexFieldData}
                enableEdit={this.state.enableEdit}
                />
            </TabPane>
            <TabPane tab="Payload" key="4">
                <EditableTable
                  columns={indexColumns}
                  dataSource={nonKeyedColumns}
                  editingAllowed={editingAllowed}
                  dataDefinitions={[]}
                  showDataDefinition={false}
                  setData={this.setNonKeyedColumnData}/>
            </TabPane>

            {!this.props.isNew ?
              <TabPane tab="Workflows" key="7">
                <AssociatedDataflows assetId={this.state.index.id} assetType={'Index'}/>
              </TabPane> : null}
          </Tabs>
        </div>

       {this.props.displayingInModal ? controls : null}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, ownProps) {
    let { selectedAsset, newAsset={}, clusterId } = state.assetReducer;
    const { user } = state.authenticationReducer;
    const { application, clusters} = state.applicationReducer;
    const {isNew=false, groupId='' } = newAsset;

    if (ownProps.selectedAsset)  selectedAsset = ownProps.selectedAsset;
    
    return {
      user,
      selectedAsset,
      application,
      isNew,
      groupId,
      clusterId,
      clusters
    };
}

const IndexDetailsForm = connect(mapStateToProps)(IndexDetails);
export default IndexDetailsForm;