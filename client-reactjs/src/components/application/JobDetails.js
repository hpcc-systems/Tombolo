import React, { Component, Fragment } from "react";
import { Modal, Tabs, Form, Input, Checkbox, Button, Space, Select, Table, AutoComplete, Spin, message, Row, Col } from 'antd/lib';
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
import { store } from '../../redux/store/Store';
import {Constants} from "../common/Constants";
import ReactMarkdown from 'react-markdown';
import {readOnlyMode, editableMode} from "../common/readOnlyUtil"


const TabPane = Tabs.TabPane;
const Option = Select.Option;
const { confirm } = Modal;

const monthMap = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',
  7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December'
};
const monthAbbrMap = {
  'JAN': 'January', 'FEB': 'February', 'MAR': 'March', 'APR': 'April', 'MAY': 'May', 'JUN': 'June',
  'JUL': 'July', 'AUG': 'August', 'SEP': 'September', 'OCT': 'October', 'NOV': 'November', 'DEC': 'December'
};
const dayMap = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday',
  5: 'Friday', 6: 'Saturday', 7: 'Sunday'
};
const dayAbbrMap = {
  'SUN': 'Sunday', 'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday',
  'THU': 'Thursday', 'FRI': 'Friday', 'SAT': 'Saturday'
};
const _minutes = [
  0,   1,  2,  3,  4,  5,  6,  7,  8,  9,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
  40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
  50, 51, 52, 53, 54, 55, 56, 57, 58, 59
];
const _hours = [
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23
 ];
const _dayOfMonth = [
  1,   2,  3,  4,  5,  6,  7,  8,  9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31
];
let scheduleCronParts = {
  'minute': [],
  'hour': [],
  'day-of-month': [],
  'month': [],
  'day-of-week': []
};
let cronExamples = [];

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
    selectedScheduleType:"",
    scheduleMinute:"*",
    scheduleHour:"*",
    scheduleDayMonth: "*",
    scheduleMonth:"*",
    scheduleDayWeek:"*",
    schedulePredecessor:[],
    predecessorJobs:[],
    clusters:[],
    selectedCluster: this.props.clusterId ? this.props.clusterId : "",
    jobSearchSuggestions:[],
    jobSearchErrorShown:false,
    autoCompleteSuffix: <SearchOutlined/>,
    searchResultsLoaded: false,
    initialDataLoading: false,
    job: {
      id:"",
      groupId: "",
      dataflowId: this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
      ecl: "",
      entryBWR:"",
      jobType: this.props.selectedJobType ? this.props.selectedJobType : '',
      gitRepo:"",
      contact:"",
      inputParams: [],
      inputFiles: [],
      outputFiles: []
    },
    enableEdit: false,
    editing: false
  }

  componentDidMount() {
    //this.props.onRef(this);
    if(this.props.application && this.props.application.applicationId) {
      this.getJobDetails();
      this.setClusters(this.props.clusterId);
      if (this.props.selectedDataflow) {
        this.getFiles();
      }
    }
    if (this.props.scheduleType === 'Predecessor') {
      this.handleScheduleTypeSelect('Predecessor');
    }

    //Getting global state
    const {viewOnlyModeReducer} = store.getState()
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
    componentWillUnmount(){

      store.dispatch({
        type: Constants.ENABLE_EDIT,
        payload: false
      })
  }
  getJobDetails() {
    if(this.props.selectedAsset !== '' && !this.props.isNew) {
      this.setState({
        initialDataLoading: true
      });

      let jobDetailsUrl = "/api/job/job_details",
          queryStringParams = {};

      if (this.props.selectedAsset && this.props.selectedAsset.id) {
        queryStringParams["job_id"] = this.props.selectedAsset.id;
      }
      if (this.props.application && this.props.application.applicationId) {
        queryStringParams["app_id"] = this.props.application.applicationId;
      }
      if (this.props.selectedDataflow && this.props.selectedDataflow.id) {
        queryStringParams["dataflow_id"] = this.props.selectedDataflow.id;
      }

      if (Object.keys(queryStringParams).length > 0) {
        jobDetailsUrl += "?";
        for (let [key, value] of Object.entries(queryStringParams)) {
          jobDetailsUrl += `${key}=${value}&`;
        }
        jobDetailsUrl = jobDetailsUrl.replace(/&$/, '');
      }

      fetch(jobDetailsUrl, {
        headers: authHeader()
      })
      .then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(data => {
        var jobfiles = [], cronParts = [];
        data.jobfiles.forEach(function(doc, idx) {
          var fileObj = {};
          fileObj=doc;
          fileObj.fileTitle=(doc.title) ? doc.title : doc.name;
          jobfiles.push(fileObj);
        });
        if (data.schedule && data.schedule.cron) {
          cronParts = data.schedule.cron.split(' ');
        }
        if (data.schedule && data.schedule.type) {
          this.handleScheduleTypeSelect(data.schedule.type);
        }
        this.setState({
          ...this.state,
          initialDataLoading: false,
          selectedScheduleType: (data.schedule && data.schedule.type) ? data.schedule.type : this.state.selectedScheduleType,
          scheduleMinute: (cronParts.length > 0) ? cronParts[0] : this.state.scheduleMinute,
          scheduleHour: (cronParts.length > 0) ? cronParts[1] : this.state.scheduleHour,
          scheduleDayMonth: (cronParts.length > 0) ? cronParts[2] : this.state.scheduleDayMonth,
          scheduleMonth: (cronParts.length > 0) ? cronParts[3] : this.state.scheduleMonth,
          scheduleDayWeek: (cronParts.length > 0) ? cronParts[4] : this.state.scheduleDayWeek,
          schedulePredecessor: (data.schedule && data.schedule.jobs) ? data.schedule.jobs : [],
          selectedCluster: data.cluster_id,
          job: {
            ...this.state.job,
            id: data.id,
            groupId: data.groupId,
            inputParams: data.jobparams,
            inputFiles: jobfiles.filter(field => field.file_type == 'input'),
            outputFiles: jobfiles.filter(field => field.file_type == 'output'),

            //For read only input

          description: data.description
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
      .catch(error => {
        console.log(error);
      });
    }
  }

  getFiles() {
    let fileUrl = "/api/file/read/file_list",
        queryStringParams = {};

    if (this.props.application && this.props.application.applicationId) {
      queryStringParams["app_id"] = this.props.application.applicationId;
    }
    if (this.props.selectedDataflow && this.props.selectedDataflow.id) {
      queryStringParams["dataflowId"] = this.props.selectedDataflow.id;
    }
    if (Object.keys(queryStringParams).length > 0) {
      fileUrl += "?";
      for (let [key, value] of Object.entries(queryStringParams)) {
        fileUrl += `${key}=${value}&`;
      }
      fileUrl = fileUrl.replace(/&$/, '');
    }

    fetch(fileUrl, {
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
    if(this.props.clusters) {
      let selectedCluster = this.props.clusters.filter(cluster => cluster.id == clusterId);
      if(selectedCluster.length > 0) {
        this.formRef.current.setFieldsValue({
          "clusters": selectedCluster[0].id
        })
      }
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
      selectedScheduleType:"",
      scheduleMinute:"*",
      scheduleHour:"*",
      scheduleDayMonth:"*",
      scheduleMonth:"*",
      scheduleDayWeek:"*",
      schedulePredecessor:[],
      predecessorJobs:[],
      selectedTab:0,
      clusters:[],
      selectedCluster:"",
      jobSearchSuggestions:[],
      searchResultsLoaded: false,
      job: {
        id:"",
        groupId: "",
        dataflowId: this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
        ecl: "",
        entryBWR:"",
        jobType: this.props.selectedJobType ? this.props.selectedJobType : '',
        gitRepo:"",
        contact:"",
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
    if(searchString.length <= 3 || this.state.jobSearchErrorShown) {
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
          message.error("There was an error searching the job from cluster");
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
          ecl: jobInfo.ecl
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
      if (this.props.selectedDataflow) {
        this.getFiles();
      }
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
      if (this.props.history) {
        this.props.history.push('/' + this.props.application.applicationId + '/assets')
      } else {
        document.querySelector('button.ant-modal-close').click();
        this.props.dispatch(assetsActions.assetSaved(saveResponse));
      }
    }, 2000);
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
    console.log(this.formRef.current.getFieldsValue());
    var jobDetails = {
      "basic": {
        ...this.formRef.current.getFieldsValue(),
        "application_id":applicationId,
        "dataflowId" : this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
        "cluster_id": this.state.selectedCluster,
        "ecl": this.state.job.ecl
      },
      "schedule": {
        "type": this.state.selectedScheduleType,
        "jobs": this.state.schedulePredecessor,
        "cron": this.joinCronTerms()
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

    return jobDetails;
  }

  handleCancel = () => {
    this.setState({
      visible: false,
    });
    //this.props.onClose();
    if (this.props.history) {
      this.props.history.push('/' + this.props.application.applicationId + '/assets');
    } else {
      this.props.onClose();//document.querySelector('button.ant-modal-close').click();
    }
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
    var outputFiles = this.state.job.outputFiles;
    outputFiles.push(selectedFile)
    this.setState({
        ...this.state,
        job: {
            ...this.state.job,
            outputFiles: outputFiles
        }
    });
  }

  handleScheduleTypeSelect = (value) => {
    let dataflowId = this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
        applicationId = this.props.application ? this.props.application.applicationId : '',
        upstreamIds = [],
        predecessors = [];
    /*if (value === 'Predecessor') {
      upstreamIds = this.props.edges.filter(edge => edge.target.id == this.props.nodeIndex).map(edge => edge.source.id);

      predecessors = this.ancestorJobs(
          this.graphFromNodesAndEdges(),
          [this.props.nodeIndex]
         )
        .map(node => node[0])
        .map(node => { return { 'id': node.id, jobId: node.jobId, 'name': node.title } });
    }*/
    predecessors = this.props.nodes.filter(node => (node.type == 'Job' && node.title != this.formRef.current.getFieldValue('title'))).map(node => { return { 'id': node.id, jobId: node.jobId, 'name': node.title } });

    this.setState({ predecessorJobs: predecessors });
  };

  generateDate = (year, month, day, hour, minute) => {
    return new Date(year, month, day, hour, minute);
  };

  nextMinute = (date) => {
    var t, n, r = 0 !== (n = (t = date).getMilliseconds()) ? new Date(t.getTime() + (1e3 - n)) : t, o = r.getSeconds();
    return 0 !== o ? new Date(r.getTime() + 1e3 * (60 - o)) : r;
  }

  nextDate = (schedule, date) => {
    let self = this;
    return Object.keys(schedule).length && schedule.month.length && schedule['day-of-month'].length && schedule['day-of-week'].length && schedule.hour.length && schedule.minute.length ? function e(schedule, _date, counter) {
      if (127 < counter) {
        return null;
      }
      let utcMonth = _date.getMonth() + 1,
          utcFullYear = _date.getFullYear();
      if (!schedule.month.includes(utcMonth)) {
        return e(schedule, self.generateDate(utcFullYear, utcMonth + 1 - 1, 1, 0, 0), ++counter);
      }
      let utcDate = _date.getDate(),
          utcDay = _date.getDay(),
          s = schedule['day-of-month'].includes(utcDate),
          c = schedule['day-of-week'].includes(utcDay);
      if (!s || !c) {
        return e(schedule, self.generateDate(utcFullYear, utcMonth - 1, utcDate + 1, 0, 0), ++counter);
      }
      let utcHour = _date.getHours();
      if (!schedule.hour.includes(utcHour)) {
        return e(schedule, self.generateDate(utcFullYear, utcMonth - 1, utcDate, utcHour + 1, 0), ++counter);
      }
      let utcMinute = _date.getMinutes();
      if (schedule.minute.includes(utcMinute)) {
        return _date;
      } else {
        return e(schedule, self.generateDate(utcFullYear, utcMonth - 1, utcDate, utcHour, utcMinute + 1), ++counter);
      }
    }(schedule, this.nextMinute(date), 1) : null;
  }

  generateCronExplainer = () => {
    let msg = '', minMatches = [], hrMatches = [], date = new Date();

    msg += this.generateCronTerm(this.state.scheduleMinute, 'minute');
    msg += this.generateCronTerm(this.state.scheduleHour, 'hour');
    msg += this.generateCronTerm(this.state.scheduleDayMonth, 'day-of-month');
    msg += this.generateCronTerm(this.state.scheduleDayWeek, 'day-of-week');
    msg += this.generateCronTerm(this.state.scheduleMonth, 'month');

    cronExamples = [];

    let lastDate = date;

    for (let i = 0; i < 3; i++) {
      if (date) {
        date = this.nextDate(scheduleCronParts, new Date(date.getTime() + 1));
        cronExamples.push(date);
      }
    }

    return msg + ((msg != '') ? '.' : '');
  };

  generateCronTerm = (term, type) => {
    let msg = '', matches = [];

    if (term.match(new RegExp(/^\*$/gm))) {
      msg += this.matchAsteriskCronTerm(type);
    } else if (matches = term.match(new RegExp(/^JAN|FEB|MAR|APR|MAY|JU[NL]|AUG|SEP|OCT|NOV|DEC|MON|TUE|WED|THU|FRI|SAT|SUN$/gm))) {
      if (matches.length > 0) {
        msg += this.matchAbbrCronTerm(matches, type);
      }
    } else if (matches = term.match(new RegExp(/^\d+$/gm))) {
      if (matches.length > 0) {
       msg += this.matchDigitsCronTerm(matches, type);
      }
    } else if (matches = term.match(new RegExp(/^(\d+,)+\d+$/gm))) {
      if (matches.length > 0) {
       msg += this.matchCommaCronTerm(matches, type);
      }
    } else if (matches = term.match(new RegExp(/^\d+\-\d+/gm))) {
      if (matches.length > 0) {
        msg += this.matchRangeCronTerm(matches, type);
      }
    } else if (matches = [...term.matchAll(new RegExp(/^\*\s*\/\s*(\d+)/gm))]) {
      if (matches.length > 0) {
        msg += this.matchStepCronTerm(matches, type);
      }
    }

    return msg;
  };

  matchAsteriskCronTerm = (type) => {
    switch (type) {
      case 'minute':
        scheduleCronParts['minute'] = _minutes;
        return 'Every minute';
      case 'hour':
        scheduleCronParts['hour'] = _hours;
        return '';
      case 'day-of-month':
        scheduleCronParts['day-of-month'] = _dayOfMonth;
        return '';
      case 'month':
        scheduleCronParts['month'] = Object.keys(monthMap).map(n => Number(n));
        return '';
      case 'day-of-week':
        scheduleCronParts['day-of-week'] = Object.keys(dayMap).filter(n => n < 7).map(n => Number(n));
        return '';
    }
  };

  matchDigitsCronTerm = (matches, type) => {
    switch (type) {
      case 'minute':
        scheduleCronParts['minute'] = [Number(matches[0])];
        return `At ${type} ${matches[0]}`;
      case 'hour':
        scheduleCronParts['hour'] = [Number(matches[0])];
        return ` past ${type} ${matches[0]}`;
      case 'day-of-month':
        scheduleCronParts['day-of-month'] = [Number(matches[0])];
        return ` on ${type} ${matches[0]}`;
      case 'month':
        scheduleCronParts['month'] = [Number(matches[0])];
        return ` in ${monthMap[matches[0]]}`;
      case 'day-of-week':
        scheduleCronParts['day-of-week'] = [Number(matches[0])];
        return ` on ${dayMap[matches[0]]}`;
    }
  };

  matchCommaCronTerm = (matches, type) => {
    let values = matches[0].split(','),
        lastVal = values.pop();

    switch (type) {
      case 'minute':
        scheduleCronParts['minute'] = [...values, lastVal].map(n => Number(n));
        return `At ${type} ${values.join(', ')}, and ${lastVal}`;
      case 'hour':
        scheduleCronParts['hour'] = [...values, lastVal].map(n => Number(n));
        return ` past ${type} ${values.join(', ')}, and ${lastVal}`;
      case 'day-of-month':
        scheduleCronParts['day-of-month'] = [...values, lastVal].map(n => Number(n));
        return ` on ${type} ${values.join(', ')}, and ${lastVal}`;
      case 'month':
        scheduleCronParts['month'] = [...values, lastVal].map(n => Number(n));
        return ` in ${values.map(v => monthMap[v]).join(', ')}, and ${monthMap[lastVal]}`;
      case 'day-of-week':
        scheduleCronParts['day-of-week'] = [...values, lastVal].map(n => Number(n));
        return ` on ${values.map(v => dayMap[v]).join(', ')}, and ${dayMap[lastVal]}`;
    }
  };

  matchRangeCronTerm = (matches, type) => {
    let msg = '',
        values = matches[0].split('-');

    switch (type) {
      case 'minute':
        scheduleCronParts['minute'] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += 'At every ';
        break;
      case 'hour':
        scheduleCronParts['hour'] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += ' past every ';
        break;
      case 'day-of-month':
        scheduleCronParts['day-of-month'] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += ' on every ';
        break;
      case 'month':
        scheduleCronParts['month'] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += ' in every ';
        values = values.map(v => monthMap[v]);
        break;
      case 'day-of-week':
        scheduleCronParts['day-of-week'] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += ' on every ';
        values = values.map(v => dayMap[v]);
        break;
    }

    msg += type + ' from ' + values.join(' through ');
    return msg;
  };

  matchStepCronTerm = (matches, type) => {
    let msg = '',
        lastVal = matches[0][matches.length],
        lastValNum = parseInt(lastVal),
        steps = [],
        stepMax = 0;

    switch (type) {
      case 'minute':
        scheduleCronParts['minute'] = steps;
        stepMax = 59;
        msg += 'Every ';
        break;
      case 'hour':
        scheduleCronParts['hour'] = steps;
        stepMax = 23;
        msg += ' past every ';
        break;
      case 'day-of-month':
        scheduleCronParts['day-of-month'] = steps;
        stepMax = 31;
        let currentMonth = new Date().getMonth() + 1,
            currentYear = new Date().getFullYear();
        if (currentMonth % 2 == 0) {
          stepMax = 30;
        } else if (currentMonth == 2) {
          if (currentYear % 4 == 0) {
            stepMax = 29;
          } else {
            stepMax = 28;
          }
        }
        msg += ' on every ';
        break;
      case 'month':
        scheduleCronParts['month'] = steps;
        stepMax = 11;
        msg += ' in every ';
        break;
      case 'day-of-week':
        scheduleCronParts['day-of-week'] = steps;
        stepMax = 6;
        msg += ' on every ';
        break;
    }

    for (let i = 0, j = lastValNum, k = stepMax; i <= k; i += j) {
      steps.push(i);
    }

    switch (20 < lastValNum ? lastValNum % 10 : lastValNum) {
      case 1:
        msg += lastVal + 'st ';
        break;
      case 2:
        msg += lastVal + 'nd ';
        break;
      case 3:
        msg += lastVal + 'rd ';
        break;
      default:
        msg += lastVal + 'th '
    }
    msg += type;
    return msg;
  };

  matchAbbrCronTerm = (matches, type) => {
    switch (type) {
      case 'month':
        return ` in ${monthAbbrMap[matches[0]]}`;
      case 'day-of-week':
        return `${((this.state.scheduleDayMonth !== '*') ? ' and ' : '')} on ${dayAbbrMap[matches[0]]}`;
    }
  };

  joinCronTerms = () => {
    return {
      'minute': this.state.scheduleMinute,
      'hour': this.state.scheduleHour,
      'dayMonth': this.state.scheduleDayMonth,
      'month': this.state.scheduleMonth,
      'dayWeek': this.state.scheduleDayWeek
    };
  };

  graphFromNodesAndEdges = () => {
    let graph = {};

    this.props.nodes.map(n => { graph[n.id] = [] });

    this.props.nodes.map(n => n.id)
      .map(id => this.props.edges.filter(e => e.source.id == id))
      .forEach(arr => {
        if (arr[0] && arr[0].source && arr[0].source.id) {
          graph[arr[0].source.id] = arr.map(n => n.target.id)
        }
      });

    return graph;
  };

  ancestorJobs = (graph, jobIds) => {
    let path = [],
        keys = Object.keys(graph),
        values = Object.values(graph);

    while (jobIds.length > 0) {
      let jobId = jobIds.shift();
      for (let i = 0; i < keys.length; i++) {
        if (values[i].indexOf(jobId) > -1) {
          jobIds.push(parseInt(keys[i], 10));
          path.push(parseInt(keys[i], 10));
        }
      }
    }

    return path.reverse()
               .map(id => this.props.nodes.filter(n => n.id == id && n.type == 'Job'))
               .filter(n => n.length > 0);
  };

  executeJob = () => {
    let _self=this;
    _self.setState({
      initialDataLoading: true,
    });
    fetch('/api/job/executeJob', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({clusterId : _self.state.selectedCluster, jobName: _self.formRef.current.getFieldValue('name')})
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      _self.setState({
        initialDataLoading: false,
      });
      message.success("Job has been submitted")
    })
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
    }, {
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
        editing: false
      });
    }


    return (

      <React.Fragment>
          {!this.state.enableEdit && editingAllowed?  <div className="button-container edit-toggle-btn">
          <Button type="primary" onClick={makeFieldsEditable}>
            Edit
          </Button>
        </div> : null }
        {this.state.editing ?  <div className="button-container view-change-toggle-btn" >
          <Button  onClick={switchToViewOnly} type="primary" ghost>
            View Changes
          </Button>

        </div> : null }
      <div>
          {!this.props.isNew ?
            <div className="loader">
              <Spin spinning={this.state.initialDataLoading} size="large" />
            </div> : null}
          <Form {...formItemLayout} labelAlign="left" ref={this.formRef} onFinish={this.handleOk} >
          <Tabs defaultActiveKey="1">

            <TabPane tab="Basic" key="1">
              {/*{this.props.isNewIndex ?*/}
              {this.state.enableEdit ?
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
              </div> : null }

              <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter a Name!' }, {
                pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
                message: 'Please enter a valid name',
              }]}>
                <Input
                id="job_name"
                onChange={this.onChange}
                placeholder="Name"
                disabled={true}
                disabled={!editingAllowed}
                className={this.state.enableEdit ? null : "read-only-input"} />
              </Form.Item>
              <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter a title!' }, {
                pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
                message: 'Please enter a valid Title',
              }]}>
                <Input id="job_title"
                onChange={this.onChange}
                placeholder="Title"
                disabled={!editingAllowed}
                className={this.state.enableEdit? null : "read-only-input"}
                 />
              </Form.Item>
              <Form.Item label="Description" name="description">
                {this.state.enableEdit ?
                <MarkdownEditor
                name="description"
                id="job_desc"
                onChange={this.onChange}
                targetDomId="jobDescr"
                value={description}
                disabled={!editingAllowed}/>
                :
                <ReactMarkdown source={this.state.job.description} />}
              </Form.Item>
              {this.props.selectedJobType != 'Data Profile' ?
                <Form.Item label="Git Repo" name="gitRepo" rules={[{
                  type: 'url',
                  message: 'Please enter a valid url',
                }]}>
                  {this.state.enableEdit ?
                  <Input id="job_gitRepo"
                   onChange={this.onChange}
                     placeholder="Git Repo"
                     value={gitRepo}
                     disabled={!editingAllowed}

                     /> :
                     <textarea className="read-only-textarea" />
                  }
                </Form.Item>
              : null }
              <Form.Item label="Entry BWR" name="entryBWR" rules={[{
                pattern: new RegExp(/^[a-zA-Z0-9:$._]*$/),
                message: 'Please enter a valid BWR',
              }]}>
                {this.state.enableEdit ?
                <Input id="job_entryBWR"
                onChange={this.onChange}
                placeholder="Primary Service"
                 value={entryBWR}
                  disabled={!editingAllowed}
                  /> :
                  <textarea className="read-only-textarea" />
                }
              </Form.Item>
              <Row type="flex">
                <Col span={12} order={1}>
                  <Form.Item {...threeColformItemLayout} label="Contact" name="contact" rules={[{
                    pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                    message: 'Please enter a valid contact',
                  }]}>
                    {this.state.enableEdit ?
                    <Input id="job_bkp_svc"
                    onChange={this.onChange}
                    placeholder="Contact"
                    value={contact}
                    disabled={!editingAllowed}
                    />
                    :
                    <textarea className="read-only-textarea" />
                }
                  </Form.Item>
                </Col>
                <Col span={12} order={2}>
                  <Form.Item label="Author:" name="author" rules={[{
                    pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                    message: 'Please enter a valid author',
                  }]}>
                  {this.state.enableEdit ?
                    <Input
                    id="job_author"
                    onChange={this.onChange}
                     placeholder="Author"
                      value={author}
                       disabled={!editingAllowed}
                       /> :
                       <textarea className="read-only-textarea" />
                  }
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Job Type" name="jobType">
                {!this.state.enableEdit ?
                <textarea
                className="read-only-textarea"
                />
        :
                <Select placeholder="Job Type" value={(jobType != '') ? jobType : ""} style={{ width: 190 }} onChange={this.onJobTypeChange} disabled={!editingAllowed}>
                    {jobTypes.map(d => <Option key={d}>{d}</Option>)}
                </Select>
  }
              </Form.Item>
            </TabPane>

            <TabPane tab="ECL" key="2">

              <Form.Item {...eclItemLayout} label="ECL" name="ecl">
                <EclEditor
                id="job_ecl"
                 targetDomId="jobEcl"
                 disabled={true}
                 />
              </Form.Item>

            </TabPane>
            <TabPane tab="Input Params" key="3">
              <EditableTable
                columns={columns}
                dataSource={inputParams}
                editingAllowed={editingAllowed}
                dataDefinitions={[]}
                showDataDefinition={false}
                setData={this.setInputParamsData}
                enableEdit={this.state.enableEdit}
                />
            </TabPane>

            <TabPane tab="Input Files" key="4">

              <div>
                {this.state.enableEdit ?
                <>
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
                </>
                : null}


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
              {!this.state.enableEdit ?  null :
              <>
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
                </> }

                <Table
                  columns={fileColumns}
                  rowKey={record => record.id}
                  dataSource={outputFiles}
                  pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
                />
              </div>
            </TabPane>

            {/* { this.props.selectedDataflow ? */}
            <TabPane tab="Schedule" key="6">
              <div>
                <Form {...threeColformItemLayout}>
                  <Form.Item label="Type">
                    <Select id="scheduleType"
                      placeholder="Select a schedule type"
                      allowClear
                      onClear={() => { this.setState({...this.state, selectedScheduleType: "" }); }}
                      onSelect={(value) => {
                        console.log(value);
                        this.handleScheduleTypeSelect(value);
                        this.setState({ selectedScheduleType: value });
                      }}
                      value={this.state.selectedScheduleType ? this.state.selectedScheduleType : null}
                    >
                      <Option value="Time">Timer based (run at specific interval)</Option>
                      <Option value="Predecessor">Job based (run after another job completes)</Option>
                    </Select> 

                  </Form.Item>
                  { this.state.selectedScheduleType === "Time" ?
                    <Fragment>
                    <Form.Item label="Run Every">
                      <Space>
                        <Input
                          style={{width: "40px", padding: "2px 6px"}}
                          onChange={ evt =>  this.setState({ scheduleMinute: evt.target.value }) }
                          value={this.state.scheduleMinute}
                          className={this.state.enableEdit? null : "read-only-input"}
                        />
                        Minute,
                        <Input
                          style={{width: "40px", padding: "2px 6px"}}
                          onChange={ evt => this.setState({ scheduleHour: evt.target.value }) }
                          value={this.state.scheduleHour}
                          className={this.state.enableEdit? null : "read-only-input"}

                        />
                        Hour,
                        <Input
                          style={{width: "40px", padding: "2px 6px"}}
                          onChange={ evt => this.setState({ scheduleDayMonth: evt.target.value }) }
                          value={this.state.scheduleDayMonth}
                          className={this.state.enableEdit? null : "read-only-input"}

                        />
                        Day of Month,
                        <Input
                          style={{width: "40px", padding: "2px 6px"}}
                          onChange={ evt => this.setState({ scheduleMonth: evt.target.value }) }
                          value={this.state.scheduleMonth}
                          className={this.state.enableEdit? null : "read-only-input"}

                        />
                        Month,
                        <Input
                          style={{width: "40px", padding: "2px 6px"}}
                          onChange={ evt => this.setState({ scheduleDayWeek: evt.target.value }) }
                          value={this.state.scheduleDayWeek}
                          className={this.state.enableEdit? null : "read-only-input"}

                        />
                        Day of Week
                      </Space>
                    </Form.Item>
                    <Form.Item label="Explained">
                      { this.generateCronExplainer() }
                    </Form.Item>
                    <Form.Item label="Would run at">
                      {(cronExamples.length > 0) ?
                        <Fragment>
                        { cronExamples.map(d => {
                          return (
                          <Fragment>
                          <span>
                            { d ? d.toLocaleString('en-US') : '' }
                          </span><br />
                          </Fragment>
                          );
                        }) }
                        <span>and so on...</span>
                        </Fragment>
                      : null}
                    </Form.Item>
                    </Fragment>
                  : null }
                  { this.state.selectedScheduleType === "Predecessor" ?
                    <Form.Item label="Run After">
                      <Select id="schedulePredecessor"
                        mode="multiple"
                        placeholder="Select Job(s) that will trigger execution"
                        allowClear
                        onClear={() => { this.setState({...this.state, schedulePredecessor: [] }); }}
                        onSelect={value => {
                          let predecessors = this.state.schedulePredecessor;
                          predecessors.push(value);
                          this.setState({ ...this.state, schedulePredecessor: predecessors });
                        }}
                        onDeselect={value => {
                          let predecessors = this.state.schedulePredecessor;
                          predecessors.splice(predecessors.indexOf(value), 1);
                          this.setState({ ...this.state, schedulePredecessor: predecessors });
                        }}
                        value={this.state.schedulePredecessor}
                      >
                        { this.state.predecessorJobs.map(job => {
                          return (
                            <Option key={job.name} value={job.jobId}>
                              {job.name}
                            </Option>
                          );
                        }) }
                      </Select>
                    </Form.Item>
                  : null }
                </Form>
              </div>
            </TabPane>
            // : null }

            {!this.props.isNew ?
            <TabPane tab="Dataflows" key="7">
              <AssociatedDataflows assetName={name} assetType={'Job'}/>
            </TabPane> : null}
          </Tabs>
          </Form>
      </div>
        <div>
          <span style={{"float": "left"}}>
            <Button disabled={!editingAllowed || this.props.isNew} type="primary" key="execute" onClick={this.executeJob}>
              Execute Job
            </Button>
          </span>
          <div className="button-container">
            {!this.props.isNew ? <Button key="danger" type="danger" onClick={this.handleDelete}>Delete</Button> : null }
            <Button key="back" onClick={this.handleCancel}>
              Cancel
            </Button>
            <Button key="submit" disabled={!editingAllowed} type="primary" loading={confirmLoading} onClick={this.handleOk}>
              Save
            </Button>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
    const { selectedAsset, newAsset={}, clusterId } = state.assetReducer;
    const { user } = state.authenticationReducer;
    const { application, clusters } = state.applicationReducer;
    const { isNew=false, groupId='' } = newAsset;
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