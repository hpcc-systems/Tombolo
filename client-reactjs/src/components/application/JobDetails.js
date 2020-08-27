import React, { Component } from "react";
import { Modal, Tabs, Form, Input, Checkbox, Button,  Select, Table, AutoComplete, Spin, Icon, message, Row, Col } from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js"
import AssociatedDataflows from "./AssociatedDataflows"
import { hasEditPermission } from "../common/AuthUtil.js";
import { fetchDataDictionary, eclTypes } from "../common/CommonUtil.js"
import {omitDeep} from '../common/CommonUtil.js';
import EditableTable from "../common/EditableTable.js"
import {handleJobDelete} from "../common/WorkflowUtil";

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
    autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />,
    dataDefinitions: [],
    job: {
      id:"",
      name:"",
      title:"",
      description:"",
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
    this.props.onRef(this);
    this.getJobDetails();
    this.getFiles();
    this.fetchDataDefinitions();
  }

  getJobDetails() {
    if(this.props.selectedAsset !== '' && !this.props.isNew) {
      fetch("/api/job/job_details?job_id="+this.props.selectedAsset+"&app_id="+this.props.applicationId, {
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
          name: data.name
        });
        return data;
      })
      .then(data => {
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
      fetch("/api/file/read/file_list?app_id="+this.props.applicationId, {
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
      let dataDefn = await fetchDataDictionary(this.props.applicationId);  
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
        autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />
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
          autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />
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
          entryBWR: jobInfo.entryBWR
        }
      })
      this.props.form.setFieldsValue({
        name: jobInfo.Jobname
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
          this.props.onRefresh(saveResponse);
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
      content: 'Are you sure you want to delete this file?',
      onOk() {
        handleJobDelete(_self.props.selectedAsset, _self.props.applicationId)
        .then(result => {
          if(_self.props.onDelete) {
            _self.props.onDelete(_self.props.currentlyEditingNode)
          } else {
            _self.props.onRefresh()  
          }
          _self.props.onClose();
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
        body: JSON.stringify(this.populateJobDetails())
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
    var applicationId = this.props.applicationId;
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
        "applicationId":applicationId,
        "dataflowId" : this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
        "name" : this.state.job.name,
        "title" : this.state.job.title,
        "description" : this.state.job.description,
        "gitRepo" : this.state.job.gitrepo,
        "entryBWR" : this.state.job.entryBWR,
        "jobType" : this.state.job.jobType,
        "contact": this.state.job.contact,
        "author": this.state.job.author,
        "clusterId": this.state.selectedCluster
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
    this.props.onClose();

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

    const {name, title, description, entryBWR, gitrepo, jobType, inputParams, outputFiles, inputFiles, contact, author } = this.state.job;
   
    //render only after fetching the data from the server
    if(!name && !this.props.selectedAsset && !this.props.isNew) {
      return null;
    }

    return (
      <div>
        <Modal
          title="Job Details"
          visible={visible}
          onCancel={this.handleCancel}
          bodyStyle={{height:"520px"}}
          destroyOnClose={true}
          width="1200px"
          footer={[
            <Checkbox onChange={this.onAutoCreateFiles} disabled={!this.props.isNew} style={{"float":"left"}}>
              Automatically create dependant files
            </Checkbox>,
            <Button type="danger" onClick={this.handleDelete}>Delete</Button>,
            <Button key="cancel" onClick={this.handleCancel}>
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
                <Input id="job_name" name="name" onChange={this.onChange} value={name} defaultValue={name} placeholder="Name" disabled={true} disabled={!editingAllowed}/>
            </Form.Item>     
             <Form.Item {...formItemLayout} label="Title">
                <Input id="job_title" name="title" onChange={this.onChange} value={title} defaultValue={title} placeholder="Title" disabled={!editingAllowed}/>
            </Form.Item>     
            <Form.Item {...formItemLayout} label="Description">
                <Input id="job_desc" name="description" onChange={this.onChange} value={description} defaultValue={description} placeholder="Description" disabled={!editingAllowed}/>
            </Form.Item>
            {this.props.selectedJobType != 'Data Profile' ? 
              <Form.Item {...formItemLayout} label="Git Repo">
                  <Input id="job_gitRepo" name="gitrepo" onChange={this.onChange} value={gitrepo} defaultValue={gitrepo} placeholder="Git Repo" disabled={!editingAllowed}/>
              </Form.Item>
              : null }
            <Form.Item {...formItemLayout} label="Entry BWR">
                <Input id="job_entryBWR" name="entryBWR" onChange={this.onChange} value={entryBWR} defaultValue={entryBWR} placeholder="Primary Service" disabled={!editingAllowed}/>
            </Form.Item>
            <Row type="flex">
              <Col span={12} order={1}>
                <Form.Item {...threeColformItemLayout} label="Contact">
                    <Input id="job_bkp_svc" name="contact" onChange={this.onChange} value={contact} defaultValue={contact} placeholder="Contact" disabled={!editingAllowed}/>
                </Form.Item>
              </Col>
              <Col span={12} order={2}>  
                <Form.Item {...threeColformItemLayout} label="Author">
                    <Input id="job_author" name="author" onChange={this.onChange} value={author} defaultValue={author} placeholder="Author" disabled={!editingAllowed}/>
                </Form.Item>
              </Col>  
            </Row>
              
            <Form.Item {...formItemLayout} label="Job Type">
                <Select placeholder="Job Type" defaultValue={jobType} style={{ width: 190 }} onSelect={this.onSourceFileSelection} disabled={!editingAllowed}>
                    {jobTypes.map(d => <Option key={d}>{d}</Option>)}
              </Select>
            </Form.Item>

          </Form>

          </TabPane>
          <TabPane tab="Input Params" key="2">
            <EditableTable 
              columns={columns} 
              dataSource={inputParams}                 
              editingAllowed={editingAllowed}
              dataDefinitions={this.state.dataDefinitions}
              showDataDefinition={true}
              setData={this.setInputParamsData}/>        
          </TabPane>

          <TabPane tab="Input Files" key="3">
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
          <TabPane tab="Output Files" key="4">
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
        </Modal>
      </div>
    );
  }
}
const JobDetailsForm = Form.create()(JobDetails);
export default JobDetailsForm;

