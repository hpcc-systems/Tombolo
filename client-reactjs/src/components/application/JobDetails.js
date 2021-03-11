import React, { Component } from "react";
import { Modal, Tabs, Form, Input, Checkbox, Button,  Select, Table, AutoComplete, Spin, message, Row, Col } from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js"
import AssociatedDataflows from "./AssociatedDataflows"
import { hasEditPermission } from "../common/AuthUtil.js";
import { fetchDataDictionary, eclTypes, omitDeep } from "../common/CommonUtil.js"
import EditableTable from "../common/EditableTable.js"
import { MarkdownEditor } from "../common/MarkdownEditor.js"
import { EclEditor } from "../common/EclEditor.js"
import {handleJobDelete} from "../common/WorkflowUtil";
import { connect } from 'react-redux';
import { SearchOutlined } from '@ant-design/icons';
import { assetsActions } from '../../redux/actions/Assets';

const TabPane = Tabs.TabPane;
const Option = Select.Option;
const { confirm } = Modal;

class JobDetails extends Component {
  formRef = React.createRef();

  constructor(props) {
    super(props);
  }

  state = {
    visible: true,
    confirmLoading: false,
    loading: false,
    jobTypes:["Data Profile", "ETL", "General", "Modeling", "Query Build", "Scoring"],
    paramName: "",
    paramType:"",
    sourceFiles:[],
    selectedInputFile:"",
    clusters:[],
    selectedCluster: this.props.clusterId ? this.props.clusterId : "",
    jobSearchSuggestions:[],
    jobSearchErrorShown:false,
    autoCompleteSuffix: <SearchOutlined/>,
    searchResultsLoaded: false,
    job: {
      id:"",
      groupId: "",
      inputParams: [],
      inputFiles: [],
      outputFiles: []
    }
  }

  componentDidMount() {
    //this.props.onRef(this);
    if(this.props.application && this.props.application.applicationId) {
      this.getJobDetails();
      this.getFiles();
      this.setClusters(this.props.clusterId);
    }
  }

  getJobDetails() {
    if(this.props.selectedAsset !== '' && !this.props.isNew) {
      this.setState({
        initialDataLoading: true
      });

      fetch("/api/job/job_details?job_id="+this.props.selectedAsset.id+"&app_id="+this.props.application.applicationId, {
        headers: authHeader()
      })
      .then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(data => {
        var jobfiles = [];
        data.jobfiles.forEach(function(doc, idx) {
          var fileObj = {};
          fileObj=doc;
          fileObj.fileTitle=(doc.title) ? doc.title : doc.name;
          jobfiles.push(fileObj);
        });
        this.setState({
          ...this.state,
          job: {
            ...this.state.job,
            id: data.id,
            groupId: data.groupId,
            inputParams: data.jobparams,
            inputFiles: jobfiles.filter(field => field.file_type == 'input'),
            outputFiles: jobfiles.filter(field => field.file_type == 'output')
         }
        });

        this.formRef.current.setFieldsValue({
          name: data.name,
          title: (data.title == '' ? data.name : data.title),
          description: data.description,
          type: data.type,
          url: data.url,
          gitRepo: data.gitRepo,
          ecl: data.ecl,
          gitRepo: data.gitRepo,
          entryBWR: data.entryBWR,
          jobType: data.jobType,
          contact: data.contact,
          author: data.author,
        })

        this.setClusters(this.props.clusterId);
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
  }

  getFiles() {
    fetch("/api/file/read/file_list?app_id="+this.props.application.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(files => {
      var fileList = [];
      files.forEach(function(doc, idx) {
        var fileObj = {};
        fileObj=doc;
        fileObj.fileTitle=(doc.title)?doc.title:doc.name;
        fileList.push(fileObj);
      });
      this.setState({
        ...this.state,
        sourceFiles: fileList
      });
    }).catch(error => {
      console.log(error);
    });
  }

  setClusters(clusterId) {
    let selectedCluster = this.props.clusters.filter(cluster => cluster.id == clusterId);
    if(selectedCluster.length > 0) {
      this.formRef.current.setFieldsValue({
        "clusters": selectedCluster[0].id
      })
    }
  }

  showModal = () => {
    this.setState({
      visible: true,
    });
    this.clearState();
    this.getJobDetails();
  }

  setInputParamsData = (data) => {
    let omitResults = omitDeep(data, 'id')
    this.setState({
      ...this.state,
      job: {
        ...this.state.job,
        inputParams: omitResults
      }
    })
  }

  clearState() {
    this.setState({
      ...this.state,
      sourceFiles:[],
      selectedInputFile:"",
      clusters:[],
      selectedCluster:"",
      jobSearchSuggestions:[],
      searchResultsLoaded: false,
      job: {
        id:"",
        groupId: "",
        inputParams: [],
        inputFiles: [],
        outputFiles: []
      }
    });
    this.formRef.current.resetFields();
  }

  onClusterSelection = (value) => {
    this.props.dispatch(assetsActions.clusterSelected(value));
    this.setState({
      selectedCluster: value,
    });
  }

  searchJobs(searchString) {
    if(searchString.length <= 3) {
      return;
    }
    this.setState({
      ...this.state,
      jobSearchErrorShown: false,
      searchResultsLoaded: false
    });

    var data = JSON.stringify({clusterid: this.state.selectedCluster, keyword: searchString, indexSearch:true});
    fetch("/api/hpcc/read/jobsearch", {
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
        jobSearchSuggestions: suggestions,
        searchResultsLoaded: true
      });
    }).catch(error => {
      if(!this.state.jobSearchErrorShown) {
        error.json().then((body) => {
          message.config({top:130})
          message.error(body.message);
        });
        this.setState({
          ...this.state,
          jobSearchErrorShown: true
        });
      }
    });
  }

  onJobSelected(option) {
    fetch("/api/hpcc/read/getJobInfo?jobWuid="+option.key+"&jobName="+option.value+"&clusterid="+this.state.selectedCluster+"&jobType="+this.state.job.jobType+"&applicationId="+this.props.application.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(jobInfo => {
      this.setState({
        ...this.state,
        job: {
          ...this.state.job,
          id: jobInfo.id,
          inputFiles: jobInfo.jobfiles.filter(jobFile => jobFile.file_type == 'input'),
          outputFiles: jobInfo.jobfiles.filter(jobFile => jobFile.file_type == 'output'),
          groupId: jobInfo.groupId,
        }
      })
      this.formRef.current.setFieldsValue({
        name: jobInfo.name,
        title: jobInfo.title,
        description: jobInfo.description,
        gitRepo: jobInfo.gitRepo,
        ecl: jobInfo.ecl,
        entryBWR: jobInfo.entryBWR
      })
      return jobInfo;
    })
    .then(data => {
      this.getFiles();
    })
    .catch(error => {
      console.log(error);
    });
  }

  handleOk = async () => {
    this.setState({
      confirmLoading: true,
    });
      let saveResponse = await this.saveJobDetails();

      setTimeout(() => {
        this.setState({
          visible: false,
          confirmLoading: false,
        });
        //this.props.onClose();
        //this.props.onRefresh(saveResponse);
        this.props.history.push('/' + this.props.application.applicationId + '/assets')
      }, 2000);
  }

  handleDelete = () => {
    let _self=this;
    confirm({
      title: 'Delete file?',
      content: 'Are you sure you want to delete this Job?',
      onOk() {
        handleJobDelete(_self.props.selectedAsset.id, _self.props.application.applicationId)
        .then(result => {
          if(_self.props.onDelete) {
            _self.props.onDelete(_self.props.currentlyEditingNode)
          } else {
            //_self.props.onRefresh()
            _self.props.history.push('/' + _self.props.application.applicationId + '/assets');
          }
          //_self.props.onClose();
          message.success("Job deleted sucessfully");
        }).catch(error => {
          console.log(error);
          message.error("There was an error deleting the Job file");
        });
      },
      onCancel() {},
    });
  }

  saveJobDetails() {
    return new Promise((resolve) => {
      fetch('/api/job/saveJob', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({isNew : this.props.isNew, id: this.state.job.id, job : this.populateJobDetails()})
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
        this.setState({
          confirmLoading: false,
        });
      });
    });
  }

  populateJobDetails() {
    var applicationId = this.props.application.applicationId;
    var inputFiles = this.state.job.inputFiles.map(function (element) {
      element.file_type = "input";
      //new job creation
      if(!element.file_id) {
        element.file_id = element.id;
      }
      delete element.id;
      return element;
    });
    var outputFiles = this.state.job.outputFiles.map(function (element) {
      element.file_type = "output";
      if(!element.file_id) {
        element.file_id = element.id;
      }
      delete element.id;
      return element;
    });

    var jobDetails = {
      "basic": {
        ...this.formRef.current.getFieldsValue(),
        "application_id":applicationId,
        "dataflowId" : this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
        "cluster_id": this.state.selectedCluster
      },
      "params": this.state.job.inputParams,
      "files" : inputFiles.concat(outputFiles),
      "mousePosition": this.props.mousePosition,
      "currentlyEditingId": this.props.currentlyEditingId,
      "autoCreateFiles": false
    };
    let groupId = this.props.groupId ? this.props.groupId : this.state.job.groupId;
    if(groupId) {
      jobDetails.basic.groupId = groupId;
    }

    console.log(jobDetails);

    return jobDetails;
  }

  handleCancel = () => {
    this.setState({
      visible: false,
    });
    //this.props.onClose();
    this.props.history.push('/' + this.props.application.applicationId + '/assets')

  }
  onChange = (e) => {
    this.setState({...this.state, job: {...this.state.job, [e.target.name]: e.target.value }});
  }
  onParamChange = (e) => {
    this.setState({...this.state, [e.target.name]: e.target.value });
  }

  handleAddInputParams = (e) => {
    var inputParams = this.state.job.inputParams;
    inputParams.push({"name":document.querySelector("#paramName").value, "type":document.querySelector("#paramType").value})
    this.setState({
        ...this.state,
        paramName:'',
        paramType:'',
        job: {
            ...this.state.job,
            inputParams: inputParams
        }
    });
  }

  handleAddInputFile = (e) => {
    let selectedFile = this.state.sourceFiles.filter(sourceFile => sourceFile.id==this.state.selectedInputFile)[0];

    var inputFiles = this.state.job.inputFiles;
    inputFiles.push(selectedFile);
    this.setState({
        ...this.state,
        job: {
            ...this.state.job,
            inputFiles: inputFiles
        }
    });
  }

  handleInputFileChange = (value) => {
    this.setState({selectedInputFile:value});
  }

  handleOutputFileChange = (value) => {
    this.setState({selectedOutputFile:value});
  }

  onJobTypeChange = (value) => {
    this.setState({...this.state, job: {...this.state.job, jobType: value }}, () => console.log(this.state.job.jobType));
  }


  handleAddOutputFile = (e) => {
    let selectedFile = this.state.sourceFiles.filter(sourceFile => sourceFile.id==this.state.selectedOutputFile)[0];
    console.log('selectedFile: '+JSON.stringify(selectedFile));
    var outputFiles = this.state.job.outputFiles;
    console.log(outputFiles);
    outputFiles.push(selectedFile)
    this.setState({
        ...this.state,
        job: {
            ...this.state.job,
            outputFiles: outputFiles
        }
    });
  }

  render() {
    const editingAllowed = hasEditPermission(this.props.user);
    const {
      visible, confirmLoading, jobTypes, paramName,
      paramType, sourceFiles, jobSearchSuggestions, clusters, searchResultsLoaded
    } = this.state;
    const formItemLayout = {
      labelCol: { span: 2 },
      wrapperCol: { span: 8 }
    };

    const eclItemLayout = {
      labelCol: { xs: { span: 2 }, sm: { span: 2 }, md: { span: 2 }, lg: { span: 2 } },
      wrapperCol: { xs: { span: 4 }, sm: { span: 24 }, md: { span: 24 }, lg: { span: 24 }, xl: { span: 24 } }
    };

    const threeColformItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 12 }
    };

    const columns = [{
      title: 'Name',
      dataIndex: 'name',
      editable: editingAllowed
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
    }];

    const fileColumns = [{
        title: 'Name',
        dataIndex: 'name',
        width: '20%',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        width: '30%'
      }];

    const {
      name, title, description, ecl, entryBWR, gitRepo,
      jobType, inputParams, outputFiles, inputFiles, contact, author
    } = this.state.job;
    const selectedCluster = clusters.filter(cluster => cluster.id == this.props.clusterId);

    //render only after fetching the data from the server
    if(!name && !this.props.selectedAsset && !this.props.isNew) {
      return null;
    }

    return (
      <React.Fragment>
      <div style={{"paddingTop": "55px"}}>
          {!this.props.isNew ?
            <div className="loader">
              <Spin spinning={this.state.initialDataLoading} size="large" />
            </div> : null}
          <Form {...formItemLayout} labelAlign="left" ref={this.formRef} onFinish={this.handleOk} >
          <Tabs
            defaultActiveKey="1"
          >

            <TabPane tab="Basic" key="1">
              {/*{this.props.isNewIndex ?*/}
              <div>
              <Form.Item {...formItemLayout} label="Cluster" name="clusters">
                <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={this.onClusterSelection} style={{ width: 190 }}>
                  {this.props.clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item label="Job" name="querySearchValue">
                <Row type="flex">
                  <Col span={21} order={1}>
                    <AutoComplete
                      className="certain-category-search"
                      dropdownClassName="certain-category-search-dropdown"
                      dropdownMatchSelectWidth={false}
                      dropdownStyle={{ width: 300 }}
                      style={{ width: '100%' }}
                      onSearch={(value) => this.searchJobs(value)}
                      onSelect={(value, option) => this.onJobSelected(option)}
                      placeholder="Search jobs"
                      disabled={!editingAllowed}
                      notFoundContent={searchResultsLoaded ? 'Not Found' : <Spin />}
                    >
                      {jobSearchSuggestions.map((suggestion) => (
                        <Option key={suggestion.value} value={suggestion.text}>
                          {suggestion.wuid}
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
              </div>
                {/*: null
              }*/}
              <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter a Name!' }, {
                pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
                message: 'Please enter a valid name',
              }]}>
                <Input id="job_name" onChange={this.onChange} placeholder="Name" disabled={true} disabled={!editingAllowed}/>
              </Form.Item>
              <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter a title!' }, {
                pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
                message: 'Please enter a valid Title',
              }]}>
                <Input id="job_title" onChange={this.onChange} placeholder="Title" disabled={!editingAllowed} />
              </Form.Item>
              <Form.Item label="Description" name="description">
                <MarkdownEditor id="job_desc" onChange={this.onChange} targetDomId="jobDescr" value={description} disabled={!editingAllowed}/>
              </Form.Item>
              {this.props.selectedJobType != 'Data Profile' ?
                <Form.Item label="Git Repo" name="gitRepo" rules={[{
                  type: 'url',
                  message: 'Please enter a valid url',
                }]}>
                  <Input id="job_gitRepo" onChange={this.onChange}  placeholder="Git Repo" value={gitRepo} disabled={!editingAllowed}/>
                </Form.Item>
              : null }
              <Form.Item label="Entry BWR" name="entryBWR" rules={[{
                pattern: new RegExp(/^[a-zA-Z0-9:$._]*$/),
                message: 'Please enter a valid BWR',
              }]}>
                <Input id="job_entryBWR" onChange={this.onChange}  placeholder="Primary Service" value={entryBWR} disabled={!editingAllowed}/>
              </Form.Item>
              <Row type="flex">
                <Col span={12} order={1}>
                  <Form.Item {...threeColformItemLayout} label="Contact" name="contact" rules={[{
                    pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                    message: 'Please enter a valid contact',
                  }]}>
                    <Input id="job_bkp_svc" onChange={this.onChange} placeholder="Contact" value={contact} disabled={!editingAllowed}/>
                  </Form.Item>
                </Col>
                <Col span={12} order={2}>
                  <Form.Item label="Author" name="author" rules={[{
                    pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                    message: 'Please enter a valid author',
                  }]}>
                    <Input id="job_author" onChange={this.onChange} placeholder="Author" value={author} disabled={!editingAllowed}/>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Job Type" name="jobType">
                <Select placeholder="Job Type" value={(jobType != '') ? jobType : ""} style={{ width: 190 }} onChange={this.onJobTypeChange} disabled={!editingAllowed}>
                    {jobTypes.map(d => <Option key={d}>{d}</Option>)}
                </Select>
              </Form.Item>
            </TabPane>

            <TabPane tab="ECL" key="2">
              <Form.Item {...eclItemLayout} label="ECL" name="ecl">
                <EclEditor id="job_ecl" targetDomId="jobEcl" disabled={true} />
              </Form.Item>
            </TabPane>
            <TabPane tab="Input Params" key="3">
              <EditableTable
                columns={columns}
                dataSource={inputParams}
                editingAllowed={editingAllowed}
                dataDefinitions={[]}
                showDataDefinition={false}
                setData={this.setInputParamsData}/>
            </TabPane>

            <TabPane tab="Input Files" key="4">
              <div>
                <Form.Item label="Input Files">
                  <Select id="inputfiles" placeholder="Select Input Files" defaultValue={this.state.selectedInputdFile} onChange={this.handleInputFileChange} style={{ width: 290 }} disabled={!editingAllowed}>
                    {sourceFiles.map(d => <Option value={d.id} key={d.id}>{(d.title)?d.title:d.name}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" onClick={this.handleAddInputFile} disabled={!editingAllowed}>
                    Add
                  </Button>
                </Form.Item>

                <Table
                  columns={fileColumns}
                  rowKey={record => record.id}
                  dataSource={inputFiles}
                  pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
                />
              </div>
            </TabPane>

            <TabPane tab="Output Files" key="5">
              <div>
                <Form.Item label="Output Files">
                  <Select id="outputfiles" placeholder="Select Output Files" defaultValue={this.state.selectedOutputFile} onChange={this.handleOutputFileChange} style={{ width: 290 }} disabled={!editingAllowed}>
                    {sourceFiles.map(d => <Option value={d.id} key={d.id}>{(d.title)?d.title:d.name}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" disabled={!editingAllowed} onClick={this.handleAddOutputFile}>
                    Add
                  </Button>
                </Form.Item>
                <Table
                  columns={fileColumns}
                  rowKey={record => record.id}
                  dataSource={outputFiles}
                  pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
                />
              </div>
            </TabPane>

            {!this.props.isNew ?
            <TabPane tab="Dataflows" key="7">
              <AssociatedDataflows assetName={name} assetType={'Job'}/>
            </TabPane> : null}
          </Tabs>
          </Form>
      </div>
      {!this.props.viewMode ?
        <div className="button-container">
          {!this.props.isNew ? <Button key="danger" type="danger" onClick={this.handleDelete}>Delete</Button> : null }
          <Button key="back" onClick={this.handleCancel}>
            Cancel
          </Button>
          <Button key="submit" disabled={!editingAllowed} type="primary" loading={confirmLoading} onClick={this.handleOk}>
            Save
          </Button>
        </div>
      : null}
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

const JobDetailsForm = connect(mapStateToProps)(JobDetails);
export default JobDetailsForm;