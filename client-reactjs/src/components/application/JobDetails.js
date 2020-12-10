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

const TabPane = Tabs.TabPane;
const Option = Select.Option;
const { confirm } = Modal;

class JobDetails extends Component {

  state = {
    visible: true,
    confirmLoading: false,
    pagination: {},
    loading: false,
    jobTypes:["Data Profile", "ETL", "General", "Modeling", "Query Build", "Scoring"],
    paramName: "",
    paramType:"",
    inputFileDesc:"",
    inputFileName:"",
    outputFileName:"",
    outputFileDesc:"",
    sourceFiles:[],
    selectedInputFile:"",
    clusters:[],
    selectedCluster:"",
    jobSearchSuggestions:[],
    jobSearchErrorShown:false,
    autoCreateFiles:false,
    autoCompleteSuffix: <SearchOutlined/>,
    dataDefinitions: [],
    job: {
      id:"",
      name:"",
      title:"",
      description:"",
      groupId: "",
      ecl: "",
      entryBWR:"",
      jobType: this.props.selectedJobType ? this.props.selectedJobType : '',
      gitrepo:"",
      contact:"",
      inputParams: [],
      inputFiles: [],
      outputFiles: []
    }
  }

  componentDidMount() {
    //this.props.onRef(this);
    console.log(this.props.application);
    if(this.props.application && this.props.application.applicationId) {
      this.getJobDetails();
      this.getClusters();
      this.getFiles();
      this.fetchDataDefinitions();
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
            name: data.name,
            title: (data.title == '' ? data.name : data.title),
            description: data.description,
            groupId: data.groupId,
            ecl: data.ecl,
            gitrepo: data.gitRepo,
            entryBWR: data.entryBWR,
            jobType: data.jobType,
            contact: data.contact,
            author: data.author,
            inputParams: data.jobparams,
            inputFiles: jobfiles.filter(field => field.file_type == 'input'),
            outputFiles: jobfiles.filter(field => field.file_type == 'output')
         }
        });
        this.props.form.setFieldsValue({
          name: data.name,
          title: (data.title == '' ? data.name : data.title),
          description: data.description,
          gitrepo: data.gitRepo,
          entryBWR: data.entryBWR,
          jobType: data.jobType,
          contact: data.contact,
          author: data.author,
          inputParams: data.jobparams,
          inputFiles: jobfiles.filter(field => field.file_type == 'input'),
          outputFiles: jobfiles.filter(field => field.file_type == 'output')
        });
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

  showModal = () => {
    this.setState({
      visible: true,
    });
    this.clearState();
    this.getJobDetails();
    /*if(this.props.isNewFile) {
      this.getClusters();
    }*/
    this.getClusters();
  }

  async fetchDataDefinitions() {
    try {
      let dataDefn = await fetchDataDictionary(this.props.application.applicationId);
      this.setState({
        dataDefinitions: dataDefn
      });
    } catch (err) {
      console.log(err)
    }
  }

  setInputParamsData = (data) => {
    console.log('setInputParamsData..'+JSON.stringify(data))
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
      inputFileDesc:"",
      inputFileName:"",
      outputFileName:"",
      outputFileDesc:"",
      sourceFiles:[],
      selectedInputFile:"",
      clusters:[],
      selectedCluster:"",
      jobSearchSuggestions:[],
      job: {
        id:"",
        name:"",
        title:"",
        description:"",
        groupId: "",
        ecl: "",
        entryBWR:"",
        jobType: this.props.selectedJobType ? this.props.selectedJobType : '',
        gitrepo:"",
        contact:"",
        inputParams: [],
        inputFiles: [],
        outputFiles: []
      }
    });

  }

  onClusterSelection = (value) => {
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
      autoCompleteSuffix : <Spin/>,
      jobSearchErrorShown: false
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
        autoCompleteSuffix: <SearchOutlined/>
      });
    }).catch(error => {
      if(!this.state.jobSearchErrorShown) {
        error.json().then((body) => {
          message.config({top:130})
          message.error(body.message);
        });
        this.setState({
          ...this.state,
          jobSearchErrorShown: true,
          autoCompleteSuffix: <SearchOutlined/>
        });
      }
    });
  }

  onJobSelected(wuid) {
    fetch("/api/hpcc/read/getJobInfo?jobWuid="+wuid+"&clusterid="+this.state.selectedCluster+"&jobType="+this.state.job.jobType, {
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
          inputFiles: jobInfo.sourceFiles,
          outputFiles: jobInfo.outputFiles,
          name: jobInfo.Jobname,
          title: jobInfo.Jobname,
          description: jobInfo.description,
          groupId: jobInfo.groupId,
          ecl: jobInfo.ecl,
          entryBWR: jobInfo.entryBWR
        }
      })
      this.props.form.setFieldsValue({
        name: jobInfo.Jobname,
        jobEcl: jobInfo.ecl,
        description: jobInfo.description,
        entryBWR: jobInfo.entryBWR
      });

      return jobInfo;
    })
    .then(data => {
      this.getFiles();
    })
    .catch(error => {
      console.log(error);
    });
  }

  handleOk = () => {
    this.props.form.validateFields(async (err, values) => {
      if(!err) {
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
    });
  }

  onAutoCreateFiles = (e) => {
    this.state.autoCreateFiles = e.target.checked;
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
      });
      //this.populateFileDetails()
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
        "application_id":applicationId,
        "dataflowId" : this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
        "name" : this.state.job.name,
        "title" : this.state.job.title,
        "description" : this.state.job.description,
        "groupId": this.state.job.groupId,
        "ecl" : this.state.job.ecl,
        "gitRepo" : this.state.job.gitrepo,
        "entryBWR" : this.state.job.entryBWR,
        "jobType" : this.state.job.jobType,
        "contact": this.state.job.contact,
        "author": this.state.job.author,
        "clusterId": this.state.selectedCluster,
      },
      "params": this.state.job.inputParams,
      "files" : inputFiles.concat(outputFiles),
      "mousePosition": this.props.mousePosition,
      "currentlyEditingId": this.props.currentlyEditingId,
      "autoCreateFiles": this.state.autoCreateFiles
    };

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
    const {getFieldDecorator} = this.props.form;
    const { visible, confirmLoading, jobTypes, paramName, paramType, inputFileName, inputFileDesc, outputFileName, outputFileDesc, sourceFiles, jobSearchSuggestions, clusters} = this.state;
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

    const eclItemLayout = {
      labelCol: { xs: { span: 2 }, sm: { span: 2 }, md: { span: 2 }, lg: { span: 2 } },
      wrapperCol: { xs: { span: 4 }, sm: { span: 19 }, md: { span: 19 }, lg: { span: 19 }, xl: { span: 19 } }
    };

    const threeColformItemLayout = {
      labelCol: {
        xs: { span: 4 },
        sm: { span: 10 },
      },
      wrapperCol: {
        xs: { span: 2 },
        sm: { span: 12 },
      },
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

    const {name, title, description, ecl, entryBWR, gitrepo, jobType, inputParams, outputFiles, inputFiles, contact, author } = this.state.job;

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

          <Tabs
            defaultActiveKey="1"
          >
            <TabPane tab="Basic" key="1">
              <Form layout="vertical">
                {/*{this.props.isNewIndex ?*/}
                <div>
                <Form.Item {...formItemLayout} label="Cluster">
                   <Select placeholder="Select a Cluster" onChange={this.onClusterSelection} style={{ width: 190 }} disabled={!editingAllowed}>
                    {clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item {...formItemLayout} label="Job">
                  <AutoComplete
                    className="certain-category-search"
                    dropdownClassName="certain-category-search-dropdown"
                    dropdownMatchSelectWidth={false}
                    dropdownStyle={{ width: 300 }}
                    size="large"
                    style={{ width: '100%' }}
                    dataSource={jobSearchSuggestions}
                    onChange={(value) => this.searchJobs(value)}
                    onSelect={(value) => this.onJobSelected(value)}
                    placeholder="Search jobs"
                    optionLabelProp="text"
                    disabled={!editingAllowed}
                  >
                    <Input id="autocomplete_field" suffix={this.state.autoCompleteSuffix} autoComplete="off"/>
                  </AutoComplete>
                </Form.Item>
                </div>
                  {/*: null
                }*/}
                <Form.Item {...formItemLayout} label="Name">
               {getFieldDecorator('name')
                (<Input id="job_name" name="name" onChange={this.onChange} placeholder="Name" disabled={true} disabled={!editingAllowed}/>)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Title">
               {getFieldDecorator('title')
                (<Input id="job_title" name="title" onChange={this.onChange} placeholder="Title" disabled={!editingAllowed}/>)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Description">
                  <MarkdownEditor id="job_desc" name="description" onChange={this.onChange} targetDomId="jobDescr" value={description} disabled={!editingAllowed}/>
                </Form.Item>
                {this.props.selectedJobType != 'Data Profile' ?
                  <Form.Item {...formItemLayout} label="Git Repo">
                {getFieldDecorator('gitrepo')
                  (<Input id="job_gitRepo" name="gitrepo" onChange={this.onChange}  placeholder="Git Repo" disabled={!editingAllowed}/>)}
                  </Form.Item>
                : null }
                <Form.Item {...formItemLayout} label="Entry BWR">
              {getFieldDecorator('entryBWR')
                (<Input id="job_entryBWR" name="entryBWR" onChange={this.onChange}  placeholder="Primary Service" disabled={!editingAllowed}/>)}
                </Form.Item>
                <Row type="flex">
                  <Col span={12} order={1}>
                    <Form.Item {...threeColformItemLayout} label="Contact">
                    {getFieldDecorator('contact')
                    (<Input id="job_bkp_svc" name="contact" onChange={this.onChange} placeholder="Contact" disabled={!editingAllowed}/>)}
                    </Form.Item>
                  </Col>
                  <Col span={12} order={2}>
                    <Form.Item {...threeColformItemLayout} label="Author">
                  {getFieldDecorator('author')
                   (<Input id="job_author" name="author" onChange={this.onChange} placeholder="Author" disabled={!editingAllowed}/>)}
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item {...formItemLayout} label="Job Type">
                  <Select placeholder="Job Type" value={(jobType != '') ? jobType : ""} style={{ width: 190 }} onChange={this.onJobTypeChange} disabled={!editingAllowed}>
                      {jobTypes.map(d => <Option key={d}>{d}</Option>)}
                  </Select>
                </Form.Item>
              </Form>
            </TabPane>

            <TabPane tab="ECL" key="2">
              <Form layout="vertical">
                <Form.Item {...eclItemLayout} label="ECL">
                  <EclEditor id="job_ecl" name="ecl" onChange={this.onChange} targetDomId="jobEcl" value={ecl} disabled={true} />
                </Form.Item>
              </Form>
            </TabPane>

            <TabPane tab="Input Params" key="3">
              <EditableTable
                columns={columns}
                dataSource={inputParams}
                editingAllowed={editingAllowed}
                dataDefinitions={this.state.dataDefinitions}
                showDataDefinition={true}
                setData={this.setInputParamsData}/>
            </TabPane>

            <TabPane tab="Input Files" key="4">
              <div>
                <Form layout="inline">
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
                </Form>

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
                <Form layout="inline">
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
                </Form>
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
    const { selectedAsset, newAsset={} } = state.assetReducer;
    const { user } = state.authenticationReducer;
    const { application } = state.applicationReducer;
    const {isNew=false, groupId='' } = newAsset;
    console.log(selectedAsset)
    return {
      user,
      selectedAsset,
      application,
      isNew,
      groupId
    };
}

const JobDetailsForm = connect(mapStateToProps)(JobDetails);
export default JobDetailsForm;