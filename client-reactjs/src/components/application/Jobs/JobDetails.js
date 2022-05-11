/* eslint-disable no-useless-escape */
import { SearchOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, message, Row, Select, Spin, Tabs, Typography } from "antd/lib";
import React, { Component } from "react";
import { connect } from "react-redux";
import { assetsActions } from "../../../redux/actions/Assets";
import { store } from "../../../redux/store/Store";
import { authHeader, handleError } from "../../common/AuthHeader.js";
import { hasEditPermission } from "../../common/AuthUtil.js";
import { eclTypes, formItemLayout, omitDeep } from "../../common/CommonUtil.js";
import { Constants } from "../../common/Constants";
import DeleteAsset from "../../common/DeleteAsset/index.js";
import { EclEditor } from "../../common/EclEditor.js";
import EditableTable from "../../common/EditableTable.js";
import { handleJobDelete } from "../../common/WorkflowUtil";
import AssociatedDataflows from "../AssociatedDataflows";
import BasicsTabGeneral from "./BasicsTabGeneral";
import BasicsTabManul from "./BasicsTabManaul";
import BasicsTabScript from "./BasicsTabScript";
import BasicsTabSpray from "./BasicsTabSpray";
import InputFiles from "./JobFiles/InputOutoutFiles";
import ScheduleTab from "./ScheduleTab.js";

const TabPane = Tabs.TabPane;
const { Option } = Select;
const { TextArea } = Input;

class JobDetails extends Component {
  formRef = React.createRef();

  state = {
    visible: true,
    confirmLoading: false,
    loading: false,
    jobTypes: [ "Data Profile", "ETL", "Job", "Manual", "Modeling", "Query Build", "Scoring", "Script", "Spray", ],
    paramName: "",
    paramType: "",
    sourceFiles: [],
    selectedInputFile: "",
    selectedOutputFile: undefined,
    clusters: [],
    selectedCluster: "",
    jobSearchSuggestions: [],
    jobSearchErrorShown: false,
    autoCompleteSuffix: <SearchOutlined />,
    searchResultsLoaded: false,
    initialDataLoading: false,
    dropZones: {},
    dropZoneFileSearchSuggestions: [],
    job: {
      id: "",
      groupId: "",
      dataflowId: this.props.selectedDataflow ? this.props.selectedDataflow.id : "",
      ecl: "",
      entryBWR: "",
      jobType: this.props?.selectedAsset?.type || "",
      gitRepo: "",
      contact: "",
      inputParams: [],
      inputFiles: [],
      outputFiles: [],
      sprayFileName: "",
      sprayedFileScope: "",
      selectedDropZoneName: {},
      manualJobFilePath : []
    },  //file path to show in cascader 
    enableEdit: false,
    editing: false,
    dataAltered: false,
    errors: false,
    isNew : this.props.isNew,
    selectedTabPaneKey : 1
  };

  async componentDidMount() {    
    const applicationId = this.props.application?.applicationId || this.props.match?.params?.applicationId;
    const assetId =  this.props?.selectedAsset?.id || this.props.match?.params?.jobId;
  
  if(applicationId){
   await this.getFiles({ applicationId });
  }

  if (applicationId && assetId) {
    await this.getJobDetails({ assetId, applicationId });
  }
  
    //Getting global state
    this.handleViewOnlyMode();
  }

  //Unmounting phase
  componentWillUnmount() {
    store.dispatch({ type: Constants.ENABLE_EDIT, payload: false, });
    store.dispatch({ type: Constants.ADD_ASSET, payload: false, });
  }

  handleViewOnlyMode(){
    //Getting global state
    this.setState({ 
        enableEdit: this.props.editMode,
        editing: this.props.editMode,
        addingNewAsset: this.props.addingNewAsset 
      });
  }


  async getJobDetails({assetId, applicationId}) {

    if (assetId) {
      this.setState({ initialDataLoading: true });
      // CREATING REQUEST URL TO GET JOB DETAILS
      const queryStringParams = {};
      if (assetId) queryStringParams['job_id'] = assetId;
      if (applicationId) queryStringParams['app_id'] = applicationId;
      if (this.props.selectedDataflow) queryStringParams['dataflow_id'] = this.props.selectedDataflow.id;


      try {
        let queryString = new URLSearchParams(queryStringParams).toString();
        const jobDetailsUrl = queryString ?  `/api/job/job_details?${queryString}` : '/api/job/job_details/';
       
        const response = await fetch(jobDetailsUrl, { headers: authHeader() }); 
        if (!response.ok) handleError(response);

        const data = await response.json();

        // GETTING JOB FILES 
        const { inputFiles, outputFiles } = data.jobFileTemplate.reduce(
          (acc, jobfile) => {
            jobfile.fileTitle = jobfile.title || jobfile.name;
            if (jobfile.file_type === 'input') acc.inputFiles.push(jobfile);
            if (jobfile.file_type === 'output') acc.outputFiles.push(jobfile);
            return acc;
          },
          { inputFiles: [], outputFiles: [] }
        );
  
        if (!data.jobType) data.jobType = '';

        this.setState({
          initialDataLoading: false,
          selectedCluster: data.cluster_id,
          job: {
            ...this.state.job,
            id: data.id,
            name: data.name,
            groupId: data.groupId,
            inputParams: data.jobparams,
            inputFiles: inputFiles,
            outputFiles: outputFiles,
            ecl: data.ecl,
            jobType: data.jobType,
            //For read only input
            description: data.description,
            sprayFileName: data.sprayFileName,
            sprayedFileScope: data.sprayedFileScope,
            manualJobFilePath: data.metaData?.manualJobs?.pathToFile,
          },
        });
  
        this.formRef.current.setFieldsValue({
          name: data.name,
          clusters: data.cluster_id,
          title: data.title || data.name,
          description: data.description,
          type: data.type,
          url: data.url,
          gitRepo: data.gitRepo,
          ecl: data.ecl,
          entryBWR: data.entryBWR,
          jobType: data.jobType,
          contact: data.contact,
          author: data.author,
          selectedAssetId: data.id,
          scriptPath: data.scriptPath || '',
          sprayFileName: data.sprayFileName,
          sprayDropZone: data.sprayDropZone,
          sprayedFileScope: data.sprayedFileScope,
          isAssociated: data.metaData.isAssociated,
          isStoredOnGithub: data.metaData.isStoredOnGithub || false,
          gitHubFiles: data.metaData?.gitHubFiles || null,
          notify : data.metaData?.notificationSettings?.notify,
          notificationSuccessMessage : data.metaData?.notificationSettings?.successMessage,
          notificationFailureMessage : data.metaData?.notificationSettings?.failureMessage,
          notificationRecipients : data.metaData?.notificationSettings?.recipients
        });
  
        return data;
      } catch (error) {
        console.log(`error getJobDetails`, error)
        this.setState({ initialDataLoading: false });
      } finally {
        this.handleViewOnlyMode();
      }
    }
  }

  setJobDetails = (jobDetails) => {
    this.setState({
      ...this.state,
      job: {
        ...this.state.job,
        id: jobDetails.id,
        groupId: jobDetails.groupId,
        ecl: jobDetails.ecl,
        inputFiles: jobDetails.jobfiles.filter(jobFile => jobFile.file_type === 'input'),
        outputFiles: jobDetails.jobfiles.filter(jobFile => jobFile.file_type === 'output'),
     }
    });
  }

  async getFiles({applicationId}) {
    const queryStringParams = {};
    if (applicationId) queryStringParams['application_id'] = applicationId;
    if (this.props.selectedDataflow) queryStringParams['dataflow_id'] = this.props.selectedDataflow.id;

    try {
      let queryString = new URLSearchParams(queryStringParams).toString();
      const fileUrl = queryString ? `/api/file/read/file_list?${queryString}` : '/api/file/read/file_list';

      const response = await fetch(fileUrl, { headers: authHeader() });
      if (!response.ok) handleError(response);
  
      const files = await response.json();
      const fileList = files.map((file) => ({ ...file, fileTitle: file.title || file.name }));
      this.setState({ sourceFiles: fileList });
    } catch (error) {
      console.log(error);
    }
  } 

  setInputParamsData = (data) => {
    let omitResults = omitDeep(data, 'id');
    this.setState({ job: { ...this.state.job, inputParams: omitResults } });
  };
  
  clearState() {
    this.setState({
      ...this.state,
      sourceFiles: [],
      selectedInputFile: "",
      selectedTab: 0,
      clusters: [],
      selectedCluster: "",
      jobSearchSuggestions: [],
      searchResultsLoaded: false,
      job: {
        id: "",
        groupId: "",
        dataflowId: this.props.selectedDataflow ? this.props.selectedDataflow.id : "",
        ecl: "",
        entryBWR: "",
        jobType: this.props?.selectedAsset?.type || "",
        gitRepo: "",
        contact: "",
        inputParams: [],
        inputFiles: [],
        outputFiles: [],
      },
    });
    this.formRef.current.resetFields();
  }

  onClusterSelection = (value) => {
    this.setState({ selectedCluster: value, });
  };
  
  handleOk = async () => {
    try {
      await this.formRef.current.validateFields();
      this.setState({ confirmLoading: true });
      const saveResponse = await this.saveJobDetails();
      // if (this.props.onAssetSaved) this.props.onAssetSaved(saveResponse);
      if(this.props.onClose) {
        // THIS METHOD WILL PASS PROPS TO GRAPH!
        const isAssociated=this.formRef.current.getFieldValue('jobSelected') 
        || this.formRef.current.getFieldValue('isAssociated')
        || this.formRef.current.getFieldValue('isStoredOnGithub') 
        || this.formRef.current.getFieldValue('jobType') === "Manual"

        const resultToGraph ={
          assetId: saveResponse.jobId,
          name: this.formRef.current.getFieldValue('name'),
          title: this.formRef.current.getFieldValue('title'),
          isAssociated, // if job is newly associated jobSelected value is gonna be true, if it is undefined we will fall-back to isAssociated value, if it is true it mean that job was previously associated, if it is falsy, then we have no associations yet;
        }       

        return this.props.onClose(resultToGraph);
      }

      if (this.props.history) {
        return this.props.history.push(`/${this.props.application.applicationId}/assets`);
      } else {
        document.querySelector('button.ant-modal-close').click();
        this.props.dispatch(assetsActions.assetSaved(saveResponse));
      }
    } catch (error) {
      console.log(`handleOk error`, error);
      let errorMessage = error?.message || "Please check your fields for errors";
      if(error?.errorFields) errorMessage = error.errorFields[0].errors[0]
      
       message.error(errorMessage) 
    }
    this.setState({ confirmLoading: false });
  };

  handleDelete = () => {
    handleJobDelete(this.props.selectedAsset.id, this.props.application.applicationId)
      .then((result) => {
        if (this.props.onDelete) {
          this.props.onDelete(this.props.currentlyEditingNode);
        } else {
          //this.props.onRefresh()
          this.props.history.push('/' + this.props.application.applicationId + '/assets');
        }
        //this.props.onClose();
        message.success('Job deleted successfully');
      })
      .catch((error) => {
        console.log(error);
        message.error('There was an error deleting the Job file');
      });
  };
  
  async saveJobDetails() {
    message.config({ maxCount: 1 });
    try {
      const payload = {
        method: 'POST',
        headers: authHeader(),
        //!! isNew: this.props.isNew, id: this.state.job.id = NOT IN USE 
        body: JSON.stringify({ isNew: this.props.isNew, id: this.state.job.id, job: await this.populateJobDetails() }),
      };
      const response = await fetch('/api/job/saveJob', payload);
  
      if (!response.ok) handleError(response);
      if (this.props.reload) this.props.reload();
  
      message.success('Data saved');
      return await response.json();
    } catch (error) {
      console.log('saveJobDetails error', error);
      message.error('Error occurred while saving the data. Please check the form data');
    } finally {
      this.setState({ confirmLoading: false });
    }
  };

  getRestructuredFiles = (filesArr, fileType) => {
    return filesArr.map((file) => {
      const structuredFile = { ...file, file_type: fileType };
      if (!structuredFile.file_id) structuredFile.file_id = file.id;
      delete structuredFile.id;
      return structuredFile;
    });
  };
  
  async populateJobDetails() {
    const formFieldsValue = this.formRef.current.getFieldsValue(true);

    const { gitHubFiles, isStoredOnGithub,  jobSelected, manualJobFilePath,  removeAssetId, renameAssetId, ...formFields } = formFieldsValue;
    //Based on this value we will save or not coresponding job data;
    let isAssociated = formFieldsValue.isAssociated || jobSelected || isStoredOnGithub;
    // Metadata will be stored as JSON we use this object for notifications, github configs and more...
    const metaData = {};
     // MANUAL JOB RELATED CODE
    if (formFieldsValue['jobType'] === 'Manual') {
      metaData.manualJobs = {
        pathToFile: manualJobFilePath || []
      };
      isAssociated = true;
    }
    // IF JOB IS NOT ASSIGN TO ANY JOB ON HPCC IT IS CONSIDERED DESIGNJOB!
    metaData.isAssociated = isAssociated;
    // GITHUB RELATED CODE
    metaData.isStoredOnGithub = isStoredOnGithub;
    metaData.gitHubFiles = !isStoredOnGithub ? null : {
      pathToFile: gitHubFiles.pathToFile, // pathToFile is essential for rebuilding cascader on selected file
      selectedFile: gitHubFiles.selectedFile, // main file data
      selectedRepoId: gitHubFiles.selectedRepoId, // Id of repo with main file
      selectedProjects: gitHubFiles.selectedProjects, // List of selected projects IDS!
    };
  
    
    //Combine notification related values and send as object
    metaData.notificationSettings = {
      notify: formFields.notify,
      recipients: formFields.notificationRecipients,
      successMessage: formFields.notificationSuccessMessage,
      failureMessage: formFields.notificationFailureMessage,
    };
  
    // JOB FILES
    const inputFiles = !isAssociated ? [] : this.getRestructuredFiles(this.state.job.inputFiles, 'input');
    const outputFiles = !isAssociated ? [] : this.getRestructuredFiles(this.state.job.outputFiles, 'output');

    // PREPARING FINAL OBJECT TO BE SEND TO BACKEND
    const jobDetails = {
      basic: {
        name: formFields.name,
        title: formFields.title,
        ecl: !isAssociated ? "" : this.state.job.ecl,
        author: formFields.author,
        contact: formFields.contact,
        gitRepo: formFields.gitRepo,
        entryBWR: formFields.entryBWR,
        jobType: formFields.jobType,
        description: formFields.description,
        scriptPath: formFields.scriptPath,
        sprayFileName: formFields.sprayFileName,
        sprayDropZone: formFields.sprayDropZone,
        sprayedFileScope: formFields.sprayedFileScope,
    
        metaData, // all fields related to github,messaging, etc. is stored here as JSON
        cluster_id: formFields.clusters || null, //keep value as null so dataflows can find this asset if no cluster selected.
        application_id: this.props.application.applicationId,
        groupId: this.props.groupId || this.state.job.groupId || '',
      },
      files: !isAssociated ? [] : inputFiles.concat(outputFiles),
      params: !isAssociated ? [] : this.state.job.inputParams,
      removeAssetId, // Asset was a design job that got associated with existing in DB job
      renameAssetId // Asset was a design job that got associated with none-existing in DB job
    };
    
    return jobDetails;
  }

  handleCancel = () => {
    this.setState({ visible: false, });
    //this.props.onClose();
    if (this.props.history) {
      this.props.history.push( "/" + this.props.application.applicationId + "/assets" );
    } else {
      this.props.onClose(); //document.querySelector('button.ant-modal-close').click();
    }
  };

  handleAddInputFile = () => {
    const selectedFile = this.state.sourceFiles.find((sourceFile) => sourceFile.id === this.state.selectedInputFile );
    selectedFile.addedManually = true;    
    this.setState({
      job: {
        ...this.state.job,
        inputFiles: [...this.state.job.inputFiles, selectedFile],
      },
    });
  };

  handleAddOutputFile = () => {
    const selectedFile = this.state.sourceFiles.find((sourceFile) => sourceFile.id === this.state.selectedOutputFile );
    selectedFile.addedManually = true;
    this.setState({
      job: {
        ...this.state.job,
        outputFiles: [...this.state.job.outputFiles, selectedFile],
      },
    });
  };
  onChange = (e) =>{
    // console.log('-e-----------------------------------------');
    // console.dir({e}, { depth: null });
    // console.log('------------------------------------------');
    
    this.setState({ job: { ...this.state.job, [e.target.name]: e.target.value } });}

  handleInputFileChange = (value) =>  this.setState({ selectedInputFile: value });

  handleOutputFileChange = (value) => this.setState({ selectedOutputFile: value });
  
  handleECLChange = (value) => this.setState({job: {...this.job, ecl: value}});

  onJobTypeChange = (value) => this.setState({ job: { ...this.state.job, jobType: value } });
  
  onDropZoneFileChange = (value) => this.setState({ job: { ...this.state.job, sprayFileName: value } });
  
  executeJob = async () => {
    try {
      this.setState({ initialDataLoading: true });
  
      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          jobId: this.state.job.id,
          jobName: this.formRef.current.getFieldValue('name'),
          clusterId: this.state.selectedCluster,
          dataflowId: this.props.selectedDataflow?.id || '',
          applicationId: this.props.application.applicationId,
        }),
      };
  
      const response = await fetch('/api/job/executeJob', options);
      if (!response.ok) handleError(response);
  
      const data = await response.json();
  
      if (data?.success) message.success('Job has been submitted');
    } catch (error) {
      console.log('-error executeJob-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
  
      message.error(error.message);
    }
    this.setState({ initialDataLoading: false });
  };

  shouldShowTab = (jobType) => {
    const invalidJobTypeForTab = {
      Script: 'Script',
      Spray: 'Spray',
      Manual: 'Manual',
    };
    // this.state.job.jobType !== 'Script' && this.state.job.jobType !== 'Spray' && this.state.job.jobType !== 'Manual'
    return invalidJobTypeForTab[jobType] ? false : true;
  };


  render() {
    const editingAllowed = hasEditPermission(this.props.user);

    const { confirmLoading, jobTypes, sourceFiles } = this.state;

    const eclItemLayout = {
      labelCol: { xs: { span: 2 }, sm: { span: 2 }, md: { span: 2 }, lg: { span: 2 }, },
      wrapperCol: { xs: { span: 4 }, sm: { span: 24 }, md: { span: 24 }, lg: { span: 24 }, xl: { span: 24 }, },
    };

    const longFieldLayout = {
      labelCol: { span: 2 },
      wrapperCol: { span: 12 },
    };

    const columns = [
      {
        title: "Name",
        dataIndex: "name",
        editable: editingAllowed,
        celleditor: "text",
        regEx: /^[a-zA-Z0-9.,:;()?!""@&#*/'$_ -]*$/
      },
      {
        title: "Type",
        dataIndex: "type",
        editable: editingAllowed,
        celleditor: "select",
        showdatadefinitioninfield: true,
        celleditorparams: {
          values: eclTypes.sort(),
        },
      },
    ];

    const scriptInputParamscolumns = [
      {
        title: "Name",
        dataIndex: "name",
        editable: editingAllowed,
      },
      {
        title: "Value",
        dataIndex: "type",
        editable: editingAllowed,
      },
    ];


    const { name, jobType, inputParams, outputFiles, inputFiles, scriptPath, } = this.state.job;

    //render only after fetching the data from the server
    if (!name && !this.props.selectedAsset && !this.props.isNew) {
      return null;
    }

    //Function to make fields editable
    const makeFieldsEditable = () => {
      // editableMode();
      this.setState({ enableEdit: !this.state.enableEdit, editing: true,});
    };

    //Switch to view only mode
    const switchToViewOnly = () => {
      // readOnlyMode();
      this.setState({ enableEdit: !this.state.enableEdit, editing: false, dataAltered: true, });
    };

    //controls
    const controls = (
      <div className={ this.props.displayingInModal ? 'assetDetail-buttons-wrapper-modal' : 'assetDetail-buttons-wrapper ' } >
        <span style={{ float: 'left' }}>
          <Button
            disabled={!editingAllowed || !this.state.enableEdit}
            type="primary"
            key="execute"
            onClick={this.executeJob}
          >
            Execute Job
          </Button>
        </span>
    
        <span className="button-container">
          {!this.state.enableEdit && editingAllowed ? (
            <Button type="primary" onClick={makeFieldsEditable}>
              Edit
            </Button>
          ) : null}
    
          {this.state.dataAltered && this.state.enableEdit ? (
            <Button onClick={switchToViewOnly}> View Changes </Button>
          ) : null}
    
          {this.state.enableEdit ? (
            <span>
              {!this.props.isNew ? (
                <DeleteAsset
                  asset={{
                    id: this.state.job.id,
                    type: 'Job',
                    title: this.formRef.current.getFieldValue('title') || this.formRef.current.getFieldValue('name'),
                  }}
                  style={{ display: 'inline-block' }}
                  onDelete={this.handleDelete}
                  component={ <Button key="danger" type="danger"> Delete </Button> }
                />
              ) : null}
              
              <span style={{ marginLeft: '25px' }}>
                <Button key="back" onClick={this.handleCancel} type="primary" ghost>
                  Cancel
                </Button>
                <Button
                  key="submit"
                  htmlType="submit"
                  disabled={!editingAllowed || this.state.errors}
                  type="primary"
                  loading={confirmLoading}
                  onClick={this.handleOk}
                  style={{ background: 'var(--success)' }}
                >
                  Save
                </Button>
              </span>
            </span>
          ) : (
            <span>
              {this.state.dataAltered ? (
                <span style={{ marginLeft: '25px' }}>
                  <Button key="back" onClick={this.handleCancel} type="primary" ghost>
                    Cancel
                  </Button>
                  <Button
                    key="submit"
                    disabled={!editingAllowed || this.state.errors}
                    type="primary"
                    loading={confirmLoading}
                    onClick={this.handleOk}
                    style={{ background: 'var(--success)' }}
                  >
                    Save
                  </Button>
                </span>
              ) : (
                <span>
                  <Button key="back" onClick={this.handleCancel} type="primary" ghost>
                    Cancel
                  </Button>
                </span>
              )}
            </span>
          )}
        </span>
      </div>
    );
    
    //When input field value is changed
    const onFieldsChange = (changedFields, allFields) => {
      const inputErrors = allFields.filter((item) => item.errors.length > 0);
      this.setState({ dataAltered: true, errors: inputErrors.length > 0 });
    };

     const noECLAvailable = this.formRef.current?.getFieldValue("isStoredOnGithub") && !this.state.job.ecl;
     const isAssociated = this.formRef.current?.getFieldValue('isAssociated'); // this value is assign only at the time of saving job. if it is true - user can not change it.
     // Make labels spacing a little wider for in modal view
     this.props.displayingInModal ?  formItemLayout.labelCol.span = 3 : formItemLayout.labelCol.span = 2;

     //JSX
    return (
      <React.Fragment>
      {this.props.displayingInModal || this.state.addingNewAsset ? null : (
        <div className="assetTitle">Job : {this.state.job.name}</div>
      )}
      <div
        className={ this.props.displayingInModal ? 'assetDetails-content-wrapper-modal' : 'assetDetails-content-wrapper' }
      >
        {!this.props.isNew ? (
          <div className="loader">
            <Spin spinning={this.state.initialDataLoading} size="large" />
          </div>
        ) : null}
        <Form
          colon={this.state.enableEdit ? true : false}
          {...formItemLayout}
          initialValues={{
            selectedFile: null,
            notify: 'Never',
            jobType: 'Job',
            isStoredOnGithub: false,
          }}
          labelAlign="left"
          ref={this.formRef}
          scrollToFirstError
          onFieldsChange={onFieldsChange}
          // labelAlign = "right"
        >
          <Tabs defaultActiveKey={this.state.selectedTabPaneKey} tabBarExtraContent={this.props.displayingInModal ? null : controls} onChange={(activeKey) => this.setState({selectedTabPaneKey: activeKey})}>
            <TabPane tab="Basic" key="1">
              <Form.Item label="Job Type" className={this.state.enableEdit ? null : 'read-only-input'}>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Form.Item noStyle name="jobType">
                      {!this.state.enableEdit ? (
                        <Typography.Text style={{ paddingLeft: '11px' }}>{jobType}</Typography.Text>
                      ) : (
                        <Select disabled={isAssociated} placeholder="Job Type" onChange={this.onJobTypeChange}>
                          {jobTypes.map((d) => (
                            <Option key={d}>{d}</Option>
                          ))}
                        </Select>
                      )}
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
              {(() => {
                switch (jobType) {
                  case 'Script':
                    return (
                      <BasicsTabScript
                        enableEdit={this.state.enableEdit}
                        editingAllowed={editingAllowed}
                        onChange={this.onChange}
                        localState={this.state}
                      />
                    );
                  case 'Spray':
                    return (
                      <BasicsTabSpray
                        enableEdit={this.state.enableEdit}
                        editingAllowed={editingAllowed}
                        addingNewAsset={this.state.addingNewAsset}
                        clearState={this.clearState}
                        onChange={this.onChange}
                        clusters={this.props.clusters}
                        localState={this.state}
                        formRef={this.formRef}
                      />
                    );
                  case 'Manual':
                    return (
                      <BasicsTabManul
                        enableEdit={this.state.enableEdit}
                        editingAllowed={editingAllowed}
                        addingNewAsset={this.state.addingNewAsset}
                        clearState={this.clearState}
                        onChange={this.onChange}
                        clusters={this.props.clusters}
                        localState={this.state}
                        formRef={this.formRef}
                      />
                    );
                  default:   // [  case 'Data Profile'; case 'ETL'; case 'Job'; case 'Modeling'; case 'Query Build'; case 'Scoring'; ]
                    return (
                      <BasicsTabGeneral
                        enableEdit={this.state.enableEdit}
                        editingAllowed={editingAllowed}
                        addingNewAsset={this.state.addingNewAsset}
                        jobType={this.state.job.jobType}
                        clearState={this.clearState}
                        onChange={this.onChange}
                        clusters={this.props.clusters}
                        localState={this.state}
                        formRef={this.formRef}
                        applicationId={this.props.application.applicationId}
                        setJobDetails={this.setJobDetails}
                        onClusterSelection={this.onClusterSelection}
                      />
                    );
                }
              })()}
            </TabPane>
    
            {this.shouldShowTab(jobType) ? (
              <TabPane tab="ECL" destroyInactiveTabPane disabled={noECLAvailable} key="2">
                  <EclEditor ecl={this.state.job.ecl} onChange={this.handleECLChange} />
              </TabPane>
            ) : jobType === 'Script' ? (
              <TabPane disabled={noECLAvailable} tab="Script" key="2">
                <Form.Item
                  {...longFieldLayout}
                  label="Script Path"
                  name="scriptPath"
                  validateTrigger="onBlur"
                  rules={[
                    {
                      required: this.state.enableEdit,
                      pattern: new RegExp(/[a-zA-Z~`_'\".-]+$/i),
                      message: 'Please enter a valid path',
                    },
                  ]}
                >
                  {this.state.enableEdit ? (
                    <Input
                      id="job_scriptPath"
                      onChange={this.onChange}
                      placeholder="Main script path"
                      value={scriptPath}
                      disabled={!editingAllowed}
                    />
                  ) : (
                    <TextArea className="read-only-textarea" disabled />
                  )}
                </Form.Item>
              </TabPane>
            ) : null}
    
            {this.shouldShowTab(jobType) ? (
              <React.Fragment>
                <TabPane disabled={noECLAvailable} tab="Input Params" key="3">
                  <EditableTable
                    columns={this.state.job.jobType !== 'Script' ? columns : scriptInputParamscolumns}
                    dataSource={inputParams}
                    editingAllowed={editingAllowed}
                    dataDefinitions={[]}
                    showDataDefinition={false}
                    setData={this.setInputParamsData}
                    enableEdit={this.state.enableEdit}
                  />
                </TabPane>
                  <TabPane disabled={noECLAvailable} tab="Input Files" key="4">
                    <InputFiles
                    inputFiles={inputFiles}
                    clusterId={this.state.selectedCluster}
                    enableEdit={this.state.enableEdit}
                    handleInputFileChange={this.handleInputFileChange}
                    editingAllowed={editingAllowed}
                    sourceFiles={sourceFiles}
                    handleAddInputFile={this.handleAddInputFile}
                    selectedTabPaneKey={this.state.selectedTabPaneKey}
                    test={this.test}
                    />

                  </TabPane>
  
                <TabPane tab="Output Files" disabled={noECLAvailable}  key="5">
                   <InputFiles
                    outputFiles={outputFiles}
                    clusterId={this.state.selectedCluster}
                    enableEdit={this.state.enableEdit}
                    handleOutputFileChange={this.handleOutputFileChange}
                    editingAllowed={editingAllowed}
                    sourceFiles={sourceFiles}
                    handleAddOutputFile={this.handleAddOutputFile}
                    selectedTabPaneKey={this.state.selectedTabPaneKey}
                    />
                </TabPane>
              </React.Fragment>
            ) : null}
        
            {this.props.selectedDataflow ? (
              <TabPane tab="Schedule" key="6">
                <ScheduleTab
                 nodes={this.props.nodes}
                 readOnly={this.props.viewMode}
                 editingAllowed={editingAllowed}
                 addToSchedule={this.props.addToSchedule} // method passed from graph to add schedule to graph
                 selectedAsset={this.props.selectedAsset}
                 dataflowId={this.props.selectedDataflow?.id}
                 applicationId={this.props.application?.applicationId || this.props.match?.params?.applicationId}
                 />
              </TabPane>
            ) : null}
    
            {!this.props.isNew ? (
              <TabPane tab="Workflows" key="7">
                <AssociatedDataflows assetId={this.state.job.id} assetType={'Job'} />
              </TabPane>
            ) : null}
          </Tabs>
        </Form>
      </div>
      {this.props.displayingInModal
       && !this.props.viewMode
        && this.state.selectedTabPaneKey !== '6' // if on schedule tab, hide controls
        ? controls
         : null}
    </React.Fragment>
    );
  }
}

function mapStateToProps(state, ownProps) {
  let { selectedAsset, newAsset = {}, clusterId } = state.assetReducer;
  const { user } = state.authenticationReducer;
  const { application, clusters } = state.applicationReducer;
  const { isNew = false, groupId = "" } = newAsset;
  const { editMode, addingNewAsset } = state.viewOnlyModeReducer;
  
  if (ownProps.selectedAsset)  selectedAsset = ownProps.selectedAsset;

  return {
    user,
    selectedAsset,
    application,
    isNew,
    groupId,
    clusterId,
    clusters,
    editMode,
    addingNewAsset
  };
}

const JobDetailsForm = connect(mapStateToProps)(JobDetails);
export default JobDetailsForm;