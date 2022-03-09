/* eslint-disable no-useless-escape */
import React, { Component, Fragment } from "react";
import { Tabs,Form,Input,Button,Space,Select,Table,Spin, message, Row, Col,} from "antd/lib";
import { authHeader, handleError } from "../../common/AuthHeader.js";
import AssociatedDataflows from "../AssociatedDataflows";
import { hasEditPermission } from "../../common/AuthUtil.js";
import { eclTypes, omitDeep, formItemLayout, threeColformItemLayout, } from "../../common/CommonUtil.js";
import EditableTable from "../../common/EditableTable.js";
import { EclEditor } from "../../common/EclEditor.js";
import { handleJobDelete } from "../../common/WorkflowUtil";
import { connect } from "react-redux";
import { SearchOutlined } from "@ant-design/icons";
import { assetsActions } from "../../../redux/actions/Assets";
import { store } from "../../../redux/store/Store";
import { Constants } from "../../common/Constants";
import { readOnlyMode, editableMode } from "../../common/readOnlyUtil";
import BasicsTabGeneral from "./BasicsTabGeneral";
import BasicsTabSpray from "./BasicsTabSpray";
import BasicsTabScript from "./BasicsTabScript";
import BasicsTabManul from "./BasicsTabManaul"
import DeleteAsset from "../../common/DeleteAsset/index.js";

const TabPane = Tabs.TabPane;
const { Option } = Select;
const { TextArea } = Input;

const monthMap = { 1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June', 7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December', };
const monthAbbrMap = { JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April', MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August', SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December', };
const dayMap = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday', };
const dayAbbrMap = { SUN: 'Sunday', MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', };
const _minutes = [...Array(60).keys()]; // [1,2,3...59]
const _hours = [...Array(24).keys()]; // [1,2,3...23]
const _dayOfMonth = [...Array(32).keys()]; // [1,2,3...31]
const expendedRowRender = (record) => {
  // For displaying files that match a template in a nested table
  const { files } = record;
  const nestedTableColumns = [
    {
      dataIndex: 'name',
      width: '24%',
    },
    {
      dataIndex: 'description',
    },
  ];

  return (
    <Table
      dataSource={files}
      columns={nestedTableColumns}
      rowKey={record.name}
      pagination={false}
      showHeader={false}
      style={{ paddingLeft: '5px' }}
    ></Table>
  );
};


let scheduleCronParts = { minute: [], hour: [], 'day-of-month': [], month: [], 'day-of-week': [] };

let cronExamples = [];


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
    selectedScheduleType: "",
    scheduleMinute: "*",
    scheduleHour: "*",
    scheduleDayMonth: "*",
    scheduleMonth: "*",
    scheduleDayWeek: "*",
    schedulePredecessor: [],
    predecessorJobs: [],
    clusters: [],
    selectedCluster: this.props.clusterId || "",
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
      jobType: this.props.selectedJobType ? this.props.selectedJobType : "",
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
  };

  async componentDidMount() {
    if (this.props.application && this.props.application.applicationId) {
      await this.getJobDetails();
      await this.getFiles();
    }
    if (this.props.scheduleType === 'Predecessor') {
      this.handleScheduleTypeSelect('Predecessor');
    }
    //Getting global state
    this.handleViewOnlyMode();
  }

  //Unmounting phase
  componentWillUnmount() {
    store.dispatch({
      type: Constants.ENABLE_EDIT,
      payload: false,
    });

    store.dispatch({
      type: Constants.ADD_ASSET,
      payload: false,
    });
  }

  handleViewOnlyMode(){
    //Getting global state
    this.setState({ 
        enableEdit: this.props.editMode,
        editing: this.props.editMode,
        addingNewAsset: this.props.addingNewAsset 
      });
  }


  async getJobDetails() {
    if (this.props.selectedAsset !== '' && this.props?.selectedAsset?.id) {
      this.setState({ initialDataLoading: true });
      // CREATING REQUEST URL TO GET JOB DETAILS
      const queryStringParams = {};
      if (this.props?.selectedAsset?.id) queryStringParams['job_id'] = this.props.selectedAsset.id;
      if (this.props?.application?.applicationId) queryStringParams['app_id'] = this.props.application.applicationId;
      if (this.props.selectedDataflow) queryStringParams['dataflow_id'] = this.props.selectedDataflow.id;

      try {
        let queryString = new URLSearchParams(queryStringParams).toString();
        const jobDetailsUrl = queryString ?  `/api/job/job_details?${queryString}` : '/api/job/job_details/';
       
        const response = await fetch(jobDetailsUrl, { headers: authHeader() }); 
        if (!response.ok) handleError(response);

        const data = await response.json();

        // GETTING CRON DETAILS
        const cronParts = data.schedule?.cron?.split(' ') || [];

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
  
        if (data.schedule?.type) this.handleScheduleTypeSelect(data.schedule.type);
  
        if (!data.jobType) data.jobType = '';

        this.setState({
          initialDataLoading: false,
          selectedScheduleType: data.schedule?.type || this.state.selectedScheduleType,
          schedulePredecessor: data.schedule?.jobs || [],
          selectedCluster: data.cluster_id,
          scheduleMinute: cronParts.length > 0 ? cronParts[0] : this.state.scheduleMinute,
          scheduleHour: cronParts.length > 0 ? cronParts[1] : this.state.scheduleHour,
          scheduleDayMonth: cronParts.length > 0 ? cronParts[2] : this.state.scheduleDayMonth,
          scheduleMonth: cronParts.length > 0 ? cronParts[3] : this.state.scheduleMonth,
          scheduleDayWeek: cronParts.length > 0 ? cronParts[4] : this.state.scheduleDayWeek,
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

  async getFiles() {
    const queryStringParams = {};
    if (this.props?.application?.applicationId) queryStringParams['app_id'] = this.props.application.applicationId;
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
  
  // !! NOT IN USE
  setClusters(clusterId) {
    if (this.props.clusters) {
      const selectedCluster = this.props.clusters.find((cluster) => cluster.id === clusterId);
      if (selectedCluster) {
        this.formRef.current.setFieldsValue({ clusters: selectedCluster.id, });
      }
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
      selectedScheduleType: "",
      scheduleMinute: "*",
      scheduleHour: "*",
      scheduleDayMonth: "*",
      scheduleMonth: "*",
      scheduleDayWeek: "*",
      schedulePredecessor: [],
      predecessorJobs: [],
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
        jobType: this.props.selectedJobType ? this.props.selectedJobType : "",
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
    this.props.dispatch(assetsActions.clusterSelected(value));
    this.setState({ selectedCluster: value, });
  };
  
  handleOk = async () => {
    try {
      await this.formRef.current.validateFields();
      this.setState({ confirmLoading: true });
      const saveResponse = await this.saveJobDetails();
      this.setState({ confirmLoading: false });
      // if (this.props.onAssetSaved) this.props.onAssetSaved(saveResponse);
      if(this.props.onClose) {
        // THIS METHIS WILL PASS PROPS TO GRAPH!
        const resultToGraph ={
          ...saveResponse,
          assetId: saveResponse.jobId,
          name: this.formRef.current.getFieldValue('name'),
          title: this.formRef.current.getFieldValue('title'),
          // if job is newly associated jobSelected value is gonna be true, if it is undefined we will fall-back to isAssociated value, if it is true it mean that job was previously associated, if it is falsy, then we have no associations yet;
          isAssociated: this.formRef.current.getFieldValue('jobSelected') || this.formRef.current.getFieldValue('isAssociated') ,
        }       

        this.props.onClose(resultToGraph);

      }
      if (this.props.history) {
        return this.props.history.push(`/${this.props.application.applicationId}/assets`);
      } else {
        document.querySelector('button.ant-modal-close').click();
        this.props.dispatch(assetsActions.assetSaved(saveResponse));
      }
    } catch (error) {
      console.log(`handleOk error`, error);
      if(error?.errorFields) message.error("Please check your fields for errors") 
    }
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

  async sendGHCreds({ GHUsername, GHToken }) {
    try {
      const payload = { GHUsername, GHToken };
      const respond = await fetch('/api/ghcredentials', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(payload),
      });
      if (!respond.ok) throw new Error('Failed to send credentials!');
      const result = await respond.json();
      return result.id;
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      message.error(error.message);
    }
  }

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
  
    const { gitHubFiles, isStoredOnGithub, ...formFields } = formFieldsValue;
  
    const metaData = {}; // metadata will be stored as JSON
  
    // GITHUB RELATED CODE
    metaData.isStoredOnGithub = isStoredOnGithub;
  
    if (!gitHubFiles) {
      metaData.gitHubFiles = null;
    } else {
      const GHUsername = gitHubFiles.gitHubUserName;
      const GHToken = gitHubFiles.gitHubUserAccessToken;
      let credsId = '';
      if (GHUsername && GHToken) {
        credsId = await this.sendGHCreds({ GHUsername, GHToken });
      }
  
      metaData.gitHubFiles = {
        credsId,
        reposList: gitHubFiles.reposList, // List of all selected repos
        selectedRepoId: gitHubFiles.selectedRepoId, // Id of repo with main file
        selectedFile: gitHubFiles.selectedFile, // main file data
        pathToFile: gitHubFiles.pathToFile, // pathToFile is essential for rebuilding cascader on selected file
      };
    }
  
    // MANUAL JOB RELATED CODE
    if (formFieldsValue['jobType'] === 'Manual') {
      if (formFieldsValue['manualJobFilePath']) {
        metaData.manualJobs = {
          pathToFile: formFieldsValue['manualJobFilePath'],
        };
      } else {
        metaData.manualJobs = {
          pathToFile: [],
        };
      }
    }
    
    //Combine notification related values and send as object
    metaData.notificationSettings = {
      notify: formFields.notify,
      recipients: formFields.notificationRecipients,
      successMessage: formFields.notificationSuccessMessage,
      failureMessage: formFields.notificationFailureMessage,
    };
  
    // IF JOB IS NOT ASSIGN TO ANY JOB ON HPCC IT IS CONSIDERED DESIGNJOB!
    metaData.isAssociated = formFields.jobSelected || isStoredOnGithub ? true : false;
  
    // JOB FILES
    const inputFiles = this.getRestructuredFiles(this.state.job.inputFiles, 'input');
    const outputFiles = this.getRestructuredFiles(this.state.job.outputFiles, 'output');

    // PREPARING FINAL OBJECT TO BE SEND TO BACKEND
    const jobDetails = {
      basic: {
        name: formFields.name,
        title: formFields.title,
        ecl: this.state.job.ecl,
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
        cluster_id: this.state.selectedCluster,
        dataflowId: this.props.selectedDataflow?.id || '',
        application_id: this.props.application.applicationId,
        groupId: this.props.groupId || this.state.job.groupId || '',
      },
      schedule: {
        type: this.state.selectedScheduleType,
        jobs: this.state.schedulePredecessor,
        cron: this.joinCronTerms(),
      },
      files: inputFiles.concat(outputFiles),
      params: this.state.job.inputParams,
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
    this.setState({
      job: {
        ...this.state.job,
        inputFiles: [...this.state.job.inputFiles, selectedFile],
      },
    });
  };

  handleAddOutputFile = () => {
    const selectedFile = this.state.sourceFiles.find((sourceFile) => sourceFile.id === this.state.selectedInputFile );
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

  onJobTypeChange = (value) => this.setState({ job: { ...this.state.job, jobType: value } });
  
  onDropZoneFileChange = (value) => this.setState({ job: { ...this.state.job, sprayFileName: value } });
  
  handleScheduleTypeSelect = () => {
    const predecessors = this.props.nodes.reduce((acc, node) => {
      if (node.type === 'Job' && node.title !== this.props.selectedNodeTitle) {
        acc.push({ id: node.id, jobId: node.assetId, name: node.title });
      }
      return acc;
    }, []);
  
    this.setState({ predecessorJobs: predecessors });
  };
  

  generateDate = (year, month, day, hour, minute) => {
    return new Date(year, month, day, hour, minute);
  };

  nextMinute = (date) => {
    var t,
      n,
      r =
        0 !== (n = (t = date).getMilliseconds())
          ? new Date(t.getTime() + (1e3 - n))
          : t,
      o = r.getSeconds();
    return 0 !== o ? new Date(r.getTime() + 1e3 * (60 - o)) : r;
  };

  nextDate = (schedule, date) => {
    let self = this;
    return Object.keys(schedule).length &&
      schedule.month.length &&
      schedule["day-of-month"].length &&
      schedule["day-of-week"].length &&
      schedule.hour.length &&
      schedule.minute.length
      ? (function e(schedule, _date, counter) {
          if (127 < counter) {
            return null;
          }
          let utcMonth = _date.getMonth() + 1,
            utcFullYear = _date.getFullYear();
          if (!schedule.month.includes(utcMonth)) {
            return e(
              schedule,
              self.generateDate(utcFullYear, utcMonth + 1 - 1, 1, 0, 0),
              ++counter
            );
          }
          let utcDate = _date.getDate(),
            utcDay = _date.getDay(),
            s = schedule["day-of-month"].includes(utcDate),
            c = schedule["day-of-week"].includes(utcDay);
          if (!s || !c) {
            return e(
              schedule,
              self.generateDate(utcFullYear, utcMonth - 1, utcDate + 1, 0, 0),
              ++counter
            );
          }
          let utcHour = _date.getHours();
          if (!schedule.hour.includes(utcHour)) {
            return e(
              schedule,
              self.generateDate(
                utcFullYear,
                utcMonth - 1,
                utcDate,
                utcHour + 1,
                0
              ),
              ++counter
            );
          }
          let utcMinute = _date.getMinutes();
          if (schedule.minute.includes(utcMinute)) {
            return _date;
          } else {
            return e(
              schedule,
              self.generateDate(
                utcFullYear,
                utcMonth - 1,
                utcDate,
                utcHour,
                utcMinute + 1
              ),
              ++counter
            );
          }
        })(schedule, this.nextMinute(date), 1)
      : null;
  };

  generateCronExplainer = () => {
    let msg = "",
      // minMatches = [],
      // hrMatches = [],
      date = new Date();

    msg += this.generateCronTerm(this.state.scheduleMinute, "minute");
    msg += this.generateCronTerm(this.state.scheduleHour, "hour");
    msg += this.generateCronTerm(this.state.scheduleDayMonth, "day-of-month");
    msg += this.generateCronTerm(this.state.scheduleDayWeek, "day-of-week");
    msg += this.generateCronTerm(this.state.scheduleMonth, "month");

    cronExamples = [];

    // let lastDate = date;

    for (let i = 0; i < 3; i++) {
      if (date) {
        date = this.nextDate(scheduleCronParts, new Date(date.getTime() + 1));
        cronExamples.push(date);
      }
    }

    return msg + (msg !== "" ? "." : "");
  };

  generateCronTerm = (term, type) => {
    let msg = "",
      matches = [];

    if (term.match(new RegExp(/^\*$/gm))) {
      msg += this.matchAsteriskCronTerm(type);
    } else if (
      (matches = term.match(
        new RegExp(
          /^JAN|FEB|MAR|APR|MAY|JU[NL]|AUG|SEP|OCT|NOV|DEC|MON|TUE|WED|THU|FRI|SAT|SUN$/gm
        )
      ))
    ) {
      if (matches.length > 0) {
        msg += this.matchAbbrCronTerm(matches, type);
      }
    } else if ((matches = term.match(new RegExp(/^\d+$/gm)))) {
      if (matches.length > 0) {
        msg += this.matchDigitsCronTerm(matches, type);
      }
    } else if ((matches = term.match(new RegExp(/^(\d+,)+\d+$/gm)))) {
      if (matches.length > 0) {
        msg += this.matchCommaCronTerm(matches, type);
      }
    // eslint-disable-next-line no-useless-escape
    } else if ((matches = term.match(new RegExp(/^\d+\-\d+/gm)))) {
      if (matches.length > 0) {
        msg += this.matchRangeCronTerm(matches, type);
      }
    } else if (
      (matches = [...term.matchAll(new RegExp(/^\*\s*\/\s*(\d+)/gm))])
    ) {
      if (matches.length > 0) {
        msg += this.matchStepCronTerm(matches, type);
      }
    }

    return msg;
  };

  matchAsteriskCronTerm = (type) => {
    switch (type) {
      case "minute":
        scheduleCronParts["minute"] = _minutes;
        return "Every minute";
      case "hour":
        scheduleCronParts["hour"] = _hours;
        return "";
      case "day-of-month":
        scheduleCronParts["day-of-month"] = _dayOfMonth;
        return "";
      case "month":
        scheduleCronParts["month"] = Object.keys(monthMap).map((n) =>
          Number(n)
        );
        return "";
      case "day-of-week":
        scheduleCronParts["day-of-week"] = Object.keys(dayMap)
          .filter((n) => n < 7)
          .map((n) => Number(n));
        return "";
      default:
        return;
    }
  };

  matchDigitsCronTerm = (matches, type) => {
    switch (type) {
      case "minute":
        scheduleCronParts["minute"] = [Number(matches[0])];
        return `At ${type} ${matches[0]}`;
      case "hour":
        scheduleCronParts["hour"] = [Number(matches[0])];
        return ` past ${type} ${matches[0]}`;
      case "day-of-month":
        scheduleCronParts["day-of-month"] = [Number(matches[0])];
        return ` on ${type} ${matches[0]}`;
      case "month":
        scheduleCronParts["month"] = [Number(matches[0])];
        return ` in ${monthMap[matches[0]]}`;
      case "day-of-week":
        scheduleCronParts["day-of-week"] = [Number(matches[0])];
        return ` on ${dayMap[matches[0]]}`;
      default:
        return;
    }
  };

  matchCommaCronTerm = (matches, type) => {
    let values = matches[0].split(","),
      lastVal = values.pop();

    switch (type) {
      case "minute":
        scheduleCronParts["minute"] = [...values, lastVal].map((n) =>
          Number(n)
        );
        return `At ${type} ${values.join(", ")}, and ${lastVal}`;
      case "hour":
        scheduleCronParts["hour"] = [...values, lastVal].map((n) => Number(n));
        return ` past ${type} ${values.join(", ")}, and ${lastVal}`;
      case "day-of-month":
        scheduleCronParts["day-of-month"] = [...values, lastVal].map((n) =>
          Number(n)
        );
        return ` on ${type} ${values.join(", ")}, and ${lastVal}`;
      case "month":
        scheduleCronParts["month"] = [...values, lastVal].map((n) => Number(n));
        return ` in ${values.map((v) => monthMap[v]).join(", ")}, and ${
          monthMap[lastVal]
        }`;
      case "day-of-week":
        scheduleCronParts["day-of-week"] = [...values, lastVal].map((n) =>
          Number(n)
        );
        return ` on ${values.map((v) => dayMap[v]).join(", ")}, and ${
          dayMap[lastVal]
        }`;
        default:
          return;
    }
  };

  matchRangeCronTerm = (matches, type) => {
    let msg = "",
      values = matches[0].split("-");

    switch (type) {
      case "minute":
        scheduleCronParts["minute"] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += "At every ";
        break;
      case "hour":
        scheduleCronParts["hour"] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += " past every ";
        break;
      case "day-of-month":
        scheduleCronParts["day-of-month"] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += " on every ";
        break;
      case "month":
        scheduleCronParts["month"] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += " in every ";
        values = values.map((v) => monthMap[v]);
        break;
      case "day-of-week":
        scheduleCronParts["day-of-week"] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += " on every ";
        values = values.map((v) => dayMap[v]);
        break;
        default:
          return;
    }

    msg += type + " from " + values.join(" through ");
    return msg;
  };

  matchStepCronTerm = (matches, type) => {
    let msg = "",
      lastVal = matches[0][matches.length],
      lastValNum = parseInt(lastVal),
      steps = [],
      stepMax = 0;

    switch (type) {
      case "minute":
        scheduleCronParts["minute"] = steps;
        stepMax = 59;
        msg += "Every ";
        break;
      case "hour":
        scheduleCronParts["hour"] = steps;
        stepMax = 23;
        msg += " past every ";
        break;
      case "day-of-month":
        scheduleCronParts["day-of-month"] = steps;
        stepMax = 31;
        let currentMonth = new Date().getMonth() + 1,
          currentYear = new Date().getFullYear();
        if (currentMonth % 2 === 0) {
          stepMax = 30;
        } else if (currentMonth === 2) {
          if (currentYear % 4 === 0) {
            stepMax = 29;
          } else {
            stepMax = 28;
          }
        }
        msg += " on every ";
        break;
      case "month":
        scheduleCronParts["month"] = steps;
        stepMax = 11;
        msg += " in every ";
        break;
      case "day-of-week":
        scheduleCronParts["day-of-week"] = steps;
        stepMax = 6;
        msg += " on every ";
        break;
        default:
          return;
    }

    for (let i = 0, j = lastValNum, k = stepMax; i <= k; i += j) {
      steps.push(i);
    }

    switch (20 < lastValNum ? lastValNum % 10 : lastValNum) {
      case 1:
        msg += lastVal + "st ";
        break;
      case 2:
        msg += lastVal + "nd ";
        break;
      case 3:
        msg += lastVal + "rd ";
        break;
      default:
        msg += lastVal + "th ";
    }
    msg += type;
    return msg;
  };

  matchAbbrCronTerm = (matches, type) => {
    const options = {
      month: ` in ${monthAbbrMap[matches[0]]}`,
      'day-of-week' : `${this.state.scheduleDayMonth !== "*" ? " and " : ""} on ${dayAbbrMap[matches[0]]}`,
    }
    return options[type] || '';
  };

  joinCronTerms = () => ({
    minute: this.state.scheduleMinute,
    hour: this.state.scheduleHour,
    dayMonth: this.state.scheduleDayMonth,
    month: this.state.scheduleMonth,
    dayWeek: this.state.scheduleDayWeek,
  });

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

    const fileColumns = [
      {
        width: '2%',
        render: (text, record) => (record.assetType === 'fileTemplate' ? <i className="fa  fa-lg fa-file-text-o"></i> : <i className="fa fa-lg fa-file-o"></i>),
      },
      {
        title: 'Name',
        dataIndex: 'name',
        width: '30%',
        render: (text, record) => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{record.fileTitle}</span>{' '}
            {record.assetType === 'fileTemplate' ? (
              <small style={{ color: 'var(--primary)' }}> [{record.files.length > 1 ? record.files.length + ' Files' : record.files.length + ' File'} ]</small>
            ) : null}
          </div>
        ),
      },
      Table.EXPAND_COLUMN,
      {
        title: 'Description',
        dataIndex: 'description',
        width: '68%',
      },
    ];

    const { name, jobType, inputParams, outputFiles, inputFiles, scriptPath, } = this.state.job;
    
    //render only after fetching the data from the server
    if (!name && !this.props.selectedAsset && !this.props.isNew) {
      return null;
    }

    //Function to make fields editable
    const makeFieldsEditable = () => {
      editableMode();
      this.setState({ enableEdit: !this.state.enableEdit, editing: true,});
    };

    //Switch to view only mode
    const switchToViewOnly = () => {
      readOnlyMode();
      this.setState({ enableEdit: !this.state.enableEdit, editing: false, dataAltered: true, });
    };

    //scheduled predecessors
    const scheduledPredecessors = (allPredecessors, selectedPredecessor) => {
      return allPredecessors.filter((predecessor) =>
        selectedPredecessor.includes(predecessor.jobId)
      );
    };


    //controls
    const controls = (
      <div className={ this.props.displayingInModal ? 'assetDetail-buttons-wrapper-modal' : 'assetDetail-buttons-wrapper ' } >
        <span style={{ float: 'left' }}>
          <Button
            disabled={!editingAllowed || !this.state.enableEdit || this.props.isNew}
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
          }}
          labelAlign="left"
          ref={this.formRef}
          scrollToFirstError
          onFieldsChange={onFieldsChange}
          // labelAlign = "right"
        >
          <Tabs defaultActiveKey="1" tabBarExtraContent={this.props.displayingInModal ? null : controls}>
            <TabPane tab="Basic" key="1">
              <Form.Item label="Job Type" className={this.state.enableEdit ? null : 'read-only-input'}>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Form.Item noStyle name="jobType">
                      {!this.state.enableEdit ? (
                        <Input disabled={!editingAllowed} placeholder="Job Type" />
                      ) : (
                        <Select placeholder="Job Type" onChange={this.onJobTypeChange}>
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
              <TabPane tab="ECL" disabled={noECLAvailable} key="2">
                <Form.Item {...eclItemLayout} label="ECL" name="ecl">
                  <EclEditor id="job_ecl" targetDomId="jobEcl" disabled={true} />
                </Form.Item>
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
                    <div>
                      {this.state.enableEdit ? (
                        <>
                          <Form.Item label="Input Files">
                            <Select
                              id="inputfiles"
                              placeholder="Select Input Files"
                              defaultValue={this.state.selectedInputdFile}
                              onChange={this.handleInputFileChange}
                              style={{ width: 290 }}
                              disabled={!editingAllowed}
                            >
                              {sourceFiles.map((d) => (
                                <Option value={d.id} key={d.id}>
                                  {d.title ? d.title : d.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item>
                            <Button
                              type="primary"
                              onClick={this.handleAddInputFile}
                              disabled={!editingAllowed}
                            >
                              Add
                            </Button>
                          </Form.Item>
                        </>
                      ) : null}

                      <Table                          
                        columns={fileColumns}
                        rowKey={(record) => record.id}
                        dataSource={inputFiles}
                        pagination={{ pageSize: 10 }}
                        scroll={{ y: 800 }}  
                        size='small'
                        rowExpandable={record => record.files}
                        expandedRowRender={ (record) => expendedRowRender(record)}
                        align='right'
                      />
                    </div>
                  </TabPane>
  
                <TabPane tab="Output Files" disabled={noECLAvailable}  key="5">
                  <div>
              {!this.state.enableEdit ? null : (
                    <>
                      <Form.Item label="Output Files">
                        <Select
                          id="outputfiles"
                          placeholder="Select Output Files"
                          defaultValue={this.state.selectedOutputFile}
                          onChange={this.handleOutputFileChange}
                          style={{ width: 290 }}
                          disabled={!editingAllowed}
                        >
                          {sourceFiles.map((d) => (
                            <Option value={d.id} key={d.id}> {d.title || d.name} </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" disabled={!editingAllowed} onClick={this.handleAddOutputFile}>
                          Add
                        </Button>
                      </Form.Item>
                    </>
                  )}
    
                    <Table
                      columns={fileColumns}
                      rowKey={(record) => record.id}
                      dataSource={outputFiles}
                      pagination={{ pageSize: 10 }}
                      scroll={{ y: 800 }}
                      size='small'
                      pagination={{ pageSize: 10 }}
                      rowExpandable={record => record.files}
                      expandedRowRender={ (record) => expendedRowRender(record)}

                    />
                  </div>
                </TabPane>
              </React.Fragment>
            ) : null}
        
            {this.props.selectedDataflow ? (
              <TabPane tab="Schedule" key="6">
                <div>
                  <Form {...threeColformItemLayout}>
                    {this.state.selectedScheduleType.length > 0 || this.state.enableEdit ? (
                      <Form.Item label="Type">
                        {!this.state.enableEdit ? (
                          <Input
                            className="read-only-input"
                            disabled
                            value={this.state.selectedScheduleType ? this.state.selectedScheduleType : null}
                          />
                        ) : (
                          <Select
                            id="scheduleType"
                            placeholder="Select a schedule type"
                            allowClear
                            onClear={() => this.setState({ selectedScheduleType: '' })}
                            onSelect={(value) => {
                              this.handleScheduleTypeSelect(value);
                              this.setState({ selectedScheduleType: value });
                            }}
                            value={this.state.selectedScheduleType ? this.state.selectedScheduleType : null}
                          >
                            <Option value="Time">Timer based (run at specific interval)</Option>
                            <Option value="Predecessor">Job based (run after another job completes)</Option>
                            <Option value="Message">
                              Run on External Message (run when a message is received in a Kafka topic)
                            </Option>
                          </Select>
                        )}
                      </Form.Item>
                    ) : (
                      <div style={{ textAlign: 'center', paddingTop: '100px' }}>
                        Please press <b>Edit</b> button to configure scheduling for this job
                      </div>
                    )}
                    {this.state.selectedScheduleType === 'Time' ? (
                      <Fragment>
                        <Form.Item label="Run Every">
                          <Space>
                            <Input
                              style={{ width: '40px', padding: '2px 6px' }}
                              onChange={(evt) => this.setState({ scheduleMinute: evt.target.value, }) }
                              value={this.state.scheduleMinute}
                              className={this.state.enableEdit ? null : 'read-only-input'}
                            />
                            Minute,
                            <Input
                              style={{ width: '40px', padding: '2px 6px' }}
                              onChange={(evt) => this.setState({ scheduleHour: evt.target.value, }) }
                              value={this.state.scheduleHour}
                              className={this.state.enableEdit ? null : 'read-only-input'}
                            />
                            Hour,
                            <Input
                              style={{ width: '40px', padding: '2px 6px' }}
                              onChange={(evt) => this.setState({ scheduleDayMonth: evt.target.value, }) }
                              value={this.state.scheduleDayMonth}
                              className={this.state.enableEdit ? null : 'read-only-input'}
                            />
                            Day of Month,
                            <Input
                              style={{ width: '40px', padding: '2px 6px' }}
                              onChange={(evt) => this.setState({ scheduleMonth: evt.target.value, }) }
                              value={this.state.scheduleMonth}
                              className={this.state.enableEdit ? null : 'read-only-input'}
                            />
                            Month,
                            <Input
                              style={{ width: '40px', padding: '2px 6px' }}
                              onChange={(evt) => this.setState({ scheduleDayWeek: evt.target.value, }) }
                              value={this.state.scheduleDayWeek}
                              className={this.state.enableEdit ? null : 'read-only-input'}
                            />
                            Day of Week
                          </Space>
                        </Form.Item>
                        <Form.Item label="Explained">{this.generateCronExplainer()}</Form.Item>
                        <Form.Item label="Would run at">
                          {cronExamples.length > 0 ? (
                            <Fragment>
                              {cronExamples.map((d) => {
                                return (
                                  <Fragment>
                                    <span>{d ? d.toLocaleString('en-US') : ''}</span>
                                    <br />
                                  </Fragment>
                                );
                              })}
                              <span>and so on...</span>
                            </Fragment>
                          ) : null}
                        </Form.Item>
                      </Fragment>
                    ) : null}
                    {this.state.selectedScheduleType === 'Predecessor' ? (
                      <Form.Item label="Run After">
                        {!this.state.enableEdit ? (
                          scheduledPredecessors(this.state.predecessorJobs, this.state.schedulePredecessor).map(
                            (item, index) => (index > 0 ? ', ' + item.name : item.name)
                          )
                        ) : (
                          // this.state.schedulePredecessor
                          <Select
                            id="schedulePredecessor"
                            mode="single"
                            placeholder="Select Job(s) that will trigger execution"
                            // allowClear
                            // onClear={() => { this.setState({...this.state, schedulePredecessor: [] }); }}
                            onSelect={(value) => {
                              let predecessors = [];
                              predecessors.push(value);
                              this.setState({
                                schedulePredecessor: predecessors,
                              });
                            }}
                            // onDeselect={value => {
                            //   let predecessors = [];
                            //   predecessors.splice(predecessors.indexOf(value), 1);
                            //   this.setState({schedulePredecessor: predecessors });
                            // }}
                            value={this.state.schedulePredecessor}
                          >
                            {this.state.predecessorJobs.map((job) => {
                              return (
                                <Option key={job.name} value={job.jobId}>
                                  {job.name}
                                </Option>
                              );
                            })}
                          </Select>
                        )}
                      </Form.Item>
                    ) : null}
                  </Form>
                </div>
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
      {this.props.displayingInModal && !this.props.viewMode ? controls : null}
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