import React, { Component } from "react";
import { Modal, Tabs, Form, Input, Button,  Select, Table, AutoComplete, Spin } from 'antd/lib';
import "react-table/react-table.css";
import { authHeader, handleError } from "../common/AuthHeader.js"
const TabPane = Tabs.TabPane;
const Option = Select.Option;


class JobDetails extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    visible: true,
    confirmLoading: false,
    pagination: {},
    loading: false,
    jobTypes:["Internal Build", "Cleaning", "Analyzing", "Machine Learning"],
    paramName: "",
    paramType:"",
    inputFileDesc:"",
    inputFileName:"",
    outputFileName:"",
    outputFileDesc:"",
    sourceFiles:[],
    selectedInputFile:"",
    job: {
      id:"",
      name:"",
      description:"",
      entryBWR:"",
      jobType:"",
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
  }

  getJobDetails() {
    if(this.props.selectedJob && !this.props.isNewJob) {
      fetch("/api/job/job_details?job_id="+this.props.selectedJob+"&app_id="+this.props.applicationId, {
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
          fileObj.fileTitle=(doc.title)?doc.title:doc.name;        
          jobfiles.push(fileObj);
      });
        this.setState({
          ...this.state,
          job: {
            ...this.state.job,
            id: data.id,
            name: data.name,
            description: data.description,
            gitRepo: data.gitRepo,
            entryBWR: data.entryBWR,
            jobType: data.jobType,
            contact: data.contact,
            author: data.author,
            inputParams: data.jobparams,
            inputFiles: jobfiles.filter(field => field.file_type == 'input'),
            outputFiles: jobfiles.filter(field => field.file_type == 'output')
          }
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
    //this.getQueryDetails();
    /*if(this.props.isNewFile) {
      this.getClusters();
    }*/
  }

  handleOk = () => {
    this.setState({
      confirmLoading: true,
    });

    this.saveJobDetails();

    setTimeout(() => {
      this.setState({
        visible: false,
        confirmLoading: false,
      });
      this.props.onClose();
      this.props.onRefresh();
    }, 2000);
  }

  saveJobDetails() {
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
    });
    //this.populateFileDetails()
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
        "name" : this.state.job.name,
        "description" : this.state.job.description,
        "gitRepo" : this.state.job.gitrepo,
        "entryBWR" : this.state.job.entryBWR,
        "jobType" : this.state.job.jobType,
        "contact": this.state.job.contact,
        "author": this.state.job.author,
      },
      "params": this.state.job.inputParams,
      "files" : inputFiles.concat(outputFiles)
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
    const { visible, confirmLoading, jobTypes, paramName, paramType, inputFileName, inputFileDesc, outputFileName, outputFileDesc, sourceFiles} = this.state;
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
    const columns = [{
      title: 'Name',
      dataIndex: 'name'
    },
    {
      title: 'Type',
      dataIndex: 'type'
    }];

    const fileColumns = [{
        title: 'Name',
        dataIndex: 'fileTitle',
        width: '20%',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        width: '30%'
      },
      {
        title: 'File Type',
        dataIndex: 'fileType',
        width: '20%'
      },
      {
        title: 'Qualified Path',
        dataIndex: 'qualifiedPath',
        width: '20%'
      }];


    const {name, description, entryBWR, gitrepo, jobType, inputParams, outputFiles, inputFiles, contact, author } = this.state.job;
    //render only after fetching the data from the server
    if(!name && !this.props.selectedJob && !this.props.isNewJob) {
      return null;
    }

    return (
      <div>
        <Modal
          title="Job Details"
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
            <Form.Item {...formItemLayout} label="Name">
                <Input id="job_name" name="name" onChange={this.onChange} value={name} defaultValue={name} placeholder="Name" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Description">
                <Input id="job_desc" name="description" onChange={this.onChange} value={description} defaultValue={description} placeholder="Description" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Git Repo">
                <Input id="job_gitrepo" name="gitrepo" onChange={this.onChange} value={gitrepo} defaultValue={gitrepo} placeholder="Git Repo URL" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Entry BWR">
                <Input id="job_entryBWR" name="entryBWR" onChange={this.onChange} value={entryBWR} defaultValue={entryBWR} placeholder="Primary Service" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Contact">
                <Input id="job_bkp_svc" name="contact" onChange={this.onChange} value={contact} defaultValue={contact} placeholder="Contact" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Author">
                <Input id="job_author" name="author" onChange={this.onChange} value={author} defaultValue={author} placeholder="Author" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Job Type">
                <Select placeholder="Job Type" defaultValue={jobType} style={{ width: 190 }} onSelect={this.onSourceFileSelection}>
                    {jobTypes.map(d => <Option key={d}>{d}</Option>)}
              </Select>
            </Form.Item>

          </Form>

          </TabPane>
          <TabPane tab="Input Params" key="2">
            <div>
            <Form layout="inline">
                <Form.Item label="Name">
                    <Input id="paramName" name="paramName" onChange={this.onParamChange} value={paramName} placeholder="" />
                </Form.Item>
                <Form.Item label="Type">
                    <Input id="paramType" name="paramType"  onChange={this.onParamChange} value={paramType}  />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" onClick={this.handleAddInputParams}>
                        Add
                    </Button>
                </Form.Item>
            </Form>

            </div>
            <Table
                  columns={columns}
                  rowKey={record => record.name}
                  dataSource={inputParams}
                  pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
                />
            </TabPane>

          <TabPane tab="Input Files" key="3">
            <div>
              <Form layout="inline">
                <Form.Item label="Input Files">
                  <Select id="inputfiles" placeholder="Select Input Files" defaultValue={this.state.selectedInputdFile} onChange={this.handleInputFileChange} style={{ width: 290 }} >
                    {sourceFiles.map(d => <Option value={d.id} key={d.id}>{(d.title)?d.title:d.name}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" onClick={this.handleAddInputFile}>
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
                  <Select id="outputfiles" placeholder="Select Output Files" defaultValue={this.state.selectedOutputFile} onChange={this.handleOutputFileChange} style={{ width: 290 }} >
                    {sourceFiles.map(d => <Option value={d.id} key={d.id}>{(d.title)?d.title:d.name}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" onClick={this.handleAddOutputFile}>
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
        </Tabs>
        </Modal>
      </div>
    );
  }
}
const JobDetailsForm = Form.create()(JobDetails);
export default JobDetailsForm;

