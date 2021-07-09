import React, { PureComponent } from "react";
import { Modal, Tabs, Form, Input, Select, AutoComplete, Spin, message, Button, Radio, Row, Col } from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { hasEditPermission } from "../common/AuthUtil.js";
import AssociatedDataflows from "./AssociatedDataflows"
import EditableTable from "../common/EditableTable.js"
import { fetchDataDictionary, eclTypes, omitDeep } from "../common/CommonUtil.js"
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import { MarkdownEditor } from "../common/MarkdownEditor.js"
import { connect } from 'react-redux';
import { SearchOutlined  } from '@ant-design/icons';
import { assetsActions } from '../../redux/actions/Assets';
import { debounce } from 'lodash';
import { store } from '../../redux/store/Store';
import {Constants} from "../common/Constants";
import ReactMarkdown from "react-markdown";
import {readOnlyMode, editableMode} from "../common/readOnlyUtil"



const TabPane = Tabs.TabPane;
const Option = Select.Option;
const { confirm } = Modal;
message.config({top:130})
class QueryDetails extends PureComponent {
  formRef = React.createRef();
  constructor(props) {
    super(props);
  }

  state = {
    visible: true,
    confirmLoading: false,
    loading: false,
    sourceFiles:[],
    selectedRowKeys:[],
    clusters:[],
    selectedCluster: this.props.clusterId ? this.props.clusterId : "",
    querySearchErrorShown:false,
    querySearchSuggestions: [],
    query: {
      id:"",
      groupId: "",
      type: "roxie_query",
      input: [],
      output: []
    },
    enableEdit: false,
    editing: false,
    dataAltered: false
  }

  //querySearchSuggestions = [];

  //Mounting phase
  componentDidMount() {
    if(this.props.application && this.props.application.applicationId) {
      this.getQueryDetails();
      this.setClusters();
    }

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

  //Unmount phase
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


  getQueryDetails() {
    if(this.props.selectedAsset && !this.props.isNew) {
      fetch("/api/query/query_details?query_id="+this.props.selectedAsset.id+"&app_id="+this.props.application.applicationId, {
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
          query: {
            ...this.state.query,
            id: data.id,
            groupId: data.groupId,
            input: data.query_fields.filter(field => field.field_type == 'input'),
            output: data.query_fields.filter(field => field.field_type == 'output'),
            name: data.name,
            //For read only
            description: data.description,

          }
        });

        this.formRef.current.setFieldsValue({
          title: data.title,
          name: data.name,
          description: data.description,
          type: data.type,
          url: data.url,
          gitRepo: data.gitRepo
        })

        return data;
      })
      .then(data => {
        this.setState({
          initialDataLoading: false
        });
      })
      .catch(error => {
        console.log(error);
      });
    }
    this.getClusters();
  }

  showModal = () => {
    this.setState({
      visible: true,
    });
  }

  setInputFieldData = (data) => {
    let omitResults = omitDeep(data, 'id')
    this.setState({
      ...this.state,
      query: {
        ...this.state.query,
        input: omitResults,
      }
    })
  }

  setOutputFieldData = (data) => {
    let omitResults = omitDeep(data, 'id')
    this.setState({
      ...this.state,
      query: {
        ...this.state.query,
        output: omitResults,
      }
    })
  }

  setClusters() {
    let selectedCluster = this.props.clusters.filter(cluster => cluster.id == this.props.clusterId);
    if(selectedCluster.length > 0) {
      this.formRef.current.setFieldsValue({
        "clusters": selectedCluster[0].id
      })
    }
  }

  clearState = () => {
    this.setState({
      ...this.state,
      canSubmit: false,
      file: {
        ...this.state.file,
        id:"",
        groupId: "",
        input: [],
        output: []
      }
    });
    this.formRef.current.resetFields();
  }

  handleDelete = () => {
    let _self=this;
    confirm({
      title: 'Delete file?',
      content: 'Are you sure you want to delete this Query?',
      onOk() {
        var data = JSON.stringify({queryId: _self.props.selectedAsset.id, application_id: _self.props.application.applicationId});
        fetch("/api/query/delete", {
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
          //_self.props.onRefresh();
          //_self.props.onClose();
          _self.props.history.push('/' + _self.props.application.applicationId + '/assets');
          message.success("Query deleted sucessfully");
        }).catch(error => {
          console.log(error);
          message.error("There was an error deleting the Query");
        });
      },
      onCancel() {}
    })
  }

  handleOk = async (e) => {
    let saveResponse = await this.saveQueryDetails();

    setTimeout(() => {
      this.setState({
        visible: false,
        confirmLoading: false,
      });
      this.props.history.push('/' + this.props.application.applicationId + '/assets')
    }, 2000);
  };

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

  searchQueries = debounce ((searchString) => {
    if(searchString.length <= 3 || this.state.querySearchErrorShown)
      return;

    this.setState({
      ...this.state,
      querySearchErrorShown: false
    });
    if(searchString.length <= 3)
      return;
    var data = JSON.stringify({clusterid: this.state.selectedCluster, keyword: searchString, indexSearch:true});
    fetch("/api/hpcc/read/querysearch", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      } else {
        throw response;
      }
      //handleError(response);
    })
    .then(suggestions => {
      //this.querySearchSuggestions = suggestions;
      //console.log(this.formRef.getFieldInstance(['title', querySearchValue]));
      this.setState({
        ...this.state,
        querySearchSuggestions: suggestions
      });
    }).catch(error => {
      if(!this.state.querySearchErrorShown) {
        error.json().then((body) => {
          message.error("There was an error searching the query from cluster.");
        });
        this.setState({
          ...this.state,
          querySearchErrorShown: true
        });
      }

    });
  }, 100);

  onQuerySelected(selectedSuggestion) {
    fetch("/api/hpcc/read/getQueryInfo?queryName="+selectedSuggestion+"&clusterid="+this.state.selectedCluster+"&applicationId="+this.props.application.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(queryInfo => {
      if(queryInfo && queryInfo.basic.groups) {
        if(queryInfo.basic.groups.filter(group => group.id == this.props.groupId).length > 0) {
          message.error("There is already a query with the same name in this Group. Please select another query")
          return;
        }
      }

      this.setState({
        ...this.state,
        sourceFiles: [],
        query: {
          ...this.state.file,
          id: queryInfo.basic.id,
          type:"roxie_query",
          input: queryInfo.basic.query_fields.filter(field => field.field_type == 'input'),
          output: queryInfo.basic.query_fields.filter(field => field.field_type == 'output')
        }
      })

      this.formRef.current.setFieldsValue({
        title: queryInfo.basic.title,
        name: queryInfo.basic.name,
        description: queryInfo.basic.description,
        url: queryInfo.basic.url,
        gitRepo: queryInfo.basic.gitRepo
      })

      return queryInfo;
    })
    .then(data => {
      //this.getQueries();
    })
    .catch(error => {
      console.log(error);
    });
  }

  getQueries() {
    fetch("/api/queries/read/file_ids?app_id="+this.props.application.applicationId, {
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

  saveQueryDetails() {
    return new Promise((resolve) => {
      fetch('/api/query/saveQuery', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({isNew : this.props.isNew, id: this.state.query.id, query : this.populateQueryDetails()})
      }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      }).then(function(data) {
        console.log('Saved..');
        resolve(data);
      }).catch(error => {
        message.error("Error occured while saving the data. Please check the form data")
      });
    //this.populateFileDetails()
    });
  }

  populateQueryDetails() {
    var applicationId = this.props.application.applicationId;

    var inputFields = this.state.query.input.map(function(element) {
      element.field_type='input';
      return element;
    });
    var outputFields = this.state.query.output.map(function(element) {
      element.field_type='output';
      return element;
    });

    var queryDetails = {
      "basic" : {
        ...this.formRef.current.getFieldsValue(),
        "application_id":applicationId,
        "type": this.state.query.type
      },
      fields: inputFields.concat(outputFields)
    };
    let groupId = this.props.groupId ? this.props.groupId : this.state.query.groupId;
    if(groupId) {
      queryDetails.basic.groupId = groupId;
    }

    //console.log(queryDetails);

    return queryDetails;
  }

  handleCancel = () => {
    this.setState({
      visible: false,
    });
    //this.props.onClose();
    if (this.props.history) {
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
    this.setState({...this.state, query: {...this.state.query, [e.target.name]: e.target.value }});
  }

  onSourceFileSelection = (value) => {
    this.setState({
      selectedSourceFile: value,
    });
  }

  queryTypeChange = (e) => {
    this.setState({
      ...this.state,
      query: {
        ...this.state.query,
        type: e.target.value
      }
    });
  }


  render() {
    const editingAllowed = hasEditPermission(this.props.user);
    const {
      visible, confirmLoading, sourceFiles, selectedRowKeys, clusters, querySearchSuggestions
    } = this.state;
    const formItemLayout = {
      labelCol: { span: 2 },
      wrapperCol: { span: 8 }
    };

    const columns = [{
      title: 'Name',
      dataIndex: 'name',
      celleditor: "text",
      editable: editingAllowed,
      regEx: /^[a-zA-Z0-9.,:;()?!""@&#*/'$_ -]*$/,
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
    },
    {
      title: 'Possible Value',
      dataIndex: 'possibleValue',
      editable: true
    },
    {
      title: 'Value Description',
      dataIndex: 'valueDescription',
      editable: true
    }];


    const {
      name, title, description, primaryService, backupService,
      type, input, output, gitRepo, url
    } = this.state.query;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectedRowKeysChange
    };
    const selectedCluster = clusters.filter(cluster => cluster.id == this.props.clusterId);

        //Function to make fields editable
    const makeFieldsEditable = () => {
      editableMode();

      this.setState({
        enableEdit: !this.state.enableEdit,
        editing: true
      });
    };

    //Switch to view only mode
    const switchToViewOnly = () => {
      readOnlyMode()

      this.setState({
        enableEdit: !this.state.enableEdit,
        editing: false,
        dataAltered: true
      });
    }

    // view edit buttons on tabpane
    const editButton  = !this.state.enableEdit && editingAllowed ?  <Button type="primary" onClick={makeFieldsEditable}> Edit  </Button> :  null ;
    const viewChangesBtn = this.state.editing ?  <Button  onClick={switchToViewOnly} type="primary" ghost> View Changes </Button> : null;
    const editandViewBtns = <div> {editButton} {viewChangesBtn}</div>

    //render only after fetching the data from the server
    //{console.log(title + ', ' + this.props.selectedQuery + ', ' + this.props.isNewFile)}
    return (
      <React.Fragment>
          {this.props.displayingInModal || this.state.addingNewAsset ? null : 
          <div style={{padding: "5px 16px", background: "var(--light)", fontWeight: "600", margin: "0px -16px"}} > 
              Query :  {this.state.query.name}
          </div>
        }
        <div className="assetDetails-content-wrapper">
        {!this.props.isNew ?
            <div className="loader">
              <Spin spinning={this.state.initialDataLoading} size="large" />
            </div> : null}
        <Tabs
          defaultActiveKey="1"
          tabBarExtraContent = {editandViewBtns}
        >
          <TabPane tab="Basic" key="1">
           <Form {...formItemLayout} labelAlign="left" ref={this.formRef} onFinish={this.handleOk} initialValues={{type: "roxie_query"}}>
            {this.state.enableEdit ?
            <div>

          {this.state.addingNewAsset ?
          <>
              <Form.Item {...formItemLayout} label="Type" name="type">
                <Radio.Group value={type} onChange={this.queryTypeChange}>
                  <Radio value={'roxie_query'}>Roxie Query</Radio>
                  <Radio value={'api'}>API/Gateway</Radio>
                </Radio.Group>
              </Form.Item>
              {type == 'roxie_query' ?
                <React.Fragment>
                <Form.Item label="Cluster" name="clusters">
                  <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={this.onClusterSelection} style={{ width: 190 }}>
                    {this.props.clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
                  </Select>
                </Form.Item>

                <Form.Item label="Query" name="querySearchValue">
                  <Row type="flex">
                    <Col span={21} order={1}>
                      <AutoComplete
                        className="certain-category-search"
                        dropdownClassName="certain-category-search-dropdown"
                        dropdownMatchSelectWidth={false}
                        dropdownStyle={{ width: 300 }}
                        style={{ width: '100%' }}
                        onSearch={(value) => this.searchQueries(value)}
                        onSelect={(value) => this.onQuerySelected(value)}
                        placeholder="Search queries"
                        disabled={!editingAllowed}
                        notFoundContent={this.state.querySearchSuggestions.length > 0 ? 'Not Found' : <Spin />}
                      >
                        {this.state.querySearchSuggestions.map((suggestion) => (
                          <Option key={suggestion.text} value={suggestion.value}>
                            {suggestion.text}
                          </Option>
                        ))}
                      </AutoComplete>
                    </Col>
                    <Col span={3} order={2} style={{"paddingLeft": "3px"}}>
                     <Button htmlType="button" onClick={this.clearState}>
                        Clear
                     </Button>
                    </Col>
                  </Row>
                </Form.Item>
                </React.Fragment>
              : null}
            </>
              : null}
            </div> : null }
            <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter a title!' }, {
                pattern: new RegExp(/^[ a-zA-Z0-9:._-]*$/),
                message: 'Please enter a valid title. Title can have  a-zA-Z0-9:._- and space',
              }]}>
              <Input id="query_title"
              onChange={this.onChange}
              placeholder="Title"
              disabled={!editingAllowed}
              className={this.state.enableEdit ? null : "read-only-input"}
              />
            </Form.Item>

            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter a name!' }, {
                  pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
                  message: 'Please enter a valid name',
                }]}>
              <Input disabled={true}
              placeholder="Name"
              disabled={!editingAllowed}
              className={this.state.enableEdit ? null : "read-only-input"}
              />
            </Form.Item>

            <Form.Item label="Description" name="description">
              {this.state.enableEdit?
              <MarkdownEditor
              id="query_desc"
              name="description"
              onChange={this.onChange}
               targetDomId="queryDescr"
               disabled={!editingAllowed}/>
               :
               <div className="read-only-markdown"><ReactMarkdown source={this.state.query.description} /> </div>
              }
            </Form.Item>
            <Form.Item label="URL" name="url" rules={[{
                type: 'url',
                message: 'Please enter a valid URL'
              }]}>
                {this.state.enableEdit ?
              <Input id="query_url"
              onChange={this.onChange}
               placeholder="URL"
               disabled={!editingAllowed}
               className={this.state.enableEdit ? null : "read-only-input"}/> :
               <textarea className="read-only-textarea" />
                }
            </Form.Item>
            <Form.Item label="Git Repo" name="gitRepo" rules={[{
                type: 'url',
                message: 'Please enter a valid URL'
              }]}>
                {this.state.enableEdit ?
              <Input
              id="query_gitRepo"
              onChange={this.onChange}
              placeholder="Git Repo URL"
              disabled={!editingAllowed}
              className={this.state.enableEdit ? null : "read-only-input"}/> :
              <textarea className="read-only-textarea" />}
            </Form.Item>
          </Form>

          </TabPane>
          <TabPane tab="Input Fields" key="2">
            <div
                className="ag-theme-balham"
                style={{
                height: '415px',
                width: '100%' }}
              >
                <EditableTable
                  columns={columns}
                  dataSource={input}
                  ref={node => (this.inputFieldsTable = node)}
                  editingAllowed={editingAllowed}
                  dataDefinitions={[]}
                  showDataDefinition={false}
                  setData={this.setInputFieldData}
                  enableEdit={this.state.enableEdit}
                  />
              </div>
            </TabPane>
          <TabPane tab="Output Fields" key="3">
            <div
                className="ag-theme-balham"
                style={{
                height: '415px',
                width: '100%' }}
              >

                <EditableTable
                  columns={columns}
                  dataSource={output}
                  ref={outputTable => (this.outputFieldsTable = outputTable)}
                  editingAllowed={editingAllowed}
                  dataDefinitions={[]}
                  showDataDefinition={false}
                  setData={this.setOutputFieldData}/>

              </div>
          </TabPane>

          {!this.props.isNew ?
            <TabPane tab="Applications" key="7">
              <AssociatedDataflows assetName={name} assetType={'Query'}/>
            </TabPane> : null}
        </Tabs>
      </div>
      <div className="assetDetail-buttons-wrapper" style={{justifyContent: "flex-end"}} >
      {this.state.enableEdit ?
          <div className="button-container" >
            <Button key="danger" type="danger" onClick={this.handleDelete}>Delete</Button>
            <Button key="back" onClick={this.handleCancel}>
              Cancel
            </Button>
            <Button key="submit" disabled={!editingAllowed} type="primary" loading={confirmLoading} onClick={this.handleOk}>
              Save
            </Button>
          </div>
        :
        <div>
          {this.state.dataAltered ?
            <div className="button-container">
            <Button key="back" onClick={this.handleCancel}>
             Cancel
            </Button>
            <Button key="submit" disabled={!editingAllowed} type="primary" loading={confirmLoading} onClick={this.handleOk}>
              Save
            </Button>
          </div>:
            <div className="button-container">
            <Button key="back" onClick={this.handleCancel}>
             Cancel
            </Button>
          </div>
  }
        </div>
      
      }
      </div>
  
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
    const { selectedAsset, newAsset={}, clusterId } = state.assetReducer;
    const { user } = state.authenticationReducer;
    const { application, clusters } = state.applicationReducer;
    const {isNew=false, groupId='' } = newAsset;
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

const QueryDetailsForm = connect(mapStateToProps)(QueryDetails);
export default QueryDetailsForm;