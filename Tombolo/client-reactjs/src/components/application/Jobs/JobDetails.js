import { message, Tabs } from 'antd';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { authHeader, handleError } from '../../common/AuthHeader.js';
import { hasEditPermission } from '../../common/AuthUtil.js';
import MonacoEditor from '../../common/MonacoEditor.js';
import Text from '../../common/Text.jsx';
import { handleJobDelete } from '../../common/WorkflowUtil';
import AssociatedDataflows from '../AssociatedDataflows';
import JobBasicTab from './BasicTab/JobBasicTab.js';
import Controls from './Controls.js';
import InputParamsTab from './InputParamsTab.js';
import InputOutoutFiles from './JobFiles/InputOutoutFiles';
import JobForm from './JobForm.js';
import ScheduleTab from './ScheduleTab.js';
import ScriptTab from './ScriptTab.js';

const TabPane = Tabs.TabPane;

class JobDetails extends Component {
  formRef = React.createRef();

  state = {
    // form fields error, true if form has errors
    errors: false,
    // Selected Cluster from dropdown
    selectedCluster: '',
    // editing states
    editing: false,
    enableEdit: false,
    dataAltered: false,
    addingNewAsset: false,
    // Tabs state
    selectedTabPaneKey: 1,
    // Loading flags
    confirmLoading: false,
    initialDataLoading: true,
    // input-output files state from files tables
    sourceFiles: [],
    selectedInputFile: '',
    selectedOutputFile: undefined,
    // job related data
    job: {
      id: '',
      groupId: '',
      dataflowId: this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
      ecl: '',
      entryBWR: '',
      jobType: this.props?.selectedAsset?.type || '',
      gitRepo: '',
      contact: '',
      inputParams: [],
      inputFiles: [],
      outputFiles: [],
      sprayFileName: '',
      sprayedFileScope: '',
      selectedDropZoneName: {},
      manualJobFilePath: [], //file path to show in cascader
    },
  };

  async componentDidMount() {
    const applicationId = this.props.application?.applicationId || this.props.match?.params?.applicationId;
    const assetId = this.props?.selectedAsset?.id || this.props.match?.params?.assetId;
    const { inTabView, viewMode } = this.props;

    if (!assetId || inTabView) this.setState({ addingNewAsset: true, enableEdit: true, editing: true });

    if (viewMode) this.setState({ addingNewAsset: false, enableEdit: false, editing: false });

    if (applicationId) await this.getFiles({ applicationId });

    if (applicationId && assetId) await this.getJobDetails({ assetId, applicationId });

    if (inTabView) {
      // if adding multiple jobs via tabs,
      // update values in jobDetails state
      this.onClusterSelection(inTabView.clusterId);
      this.onJobTypeChange(inTabView.jobType);

      // update form values
      this.formRef.current.setFieldsValue({
        jobType: inTabView.jobType,
        clusters: inTabView.clusterId,
        isStoredOnGithub: inTabView.isStoredOnGithub,
      });
    }
    // we will start with initialDataLoading true as initial state, after component mounted we flip this flag
    this.setState({ initialDataLoading: false });
  }

  async getJobDetails({ assetId, applicationId }) {
    if (assetId) {
      this.setState({ initialDataLoading: true });
      // CREATING REQUEST URL TO GET JOB DETAILS
      const queryStringParams = {};
      if (assetId) queryStringParams['job_id'] = assetId;
      if (applicationId) queryStringParams['app_id'] = applicationId;
      if (this.props.selectedDataflow) queryStringParams['dataflow_id'] = this.props.selectedDataflow.id;

      try {
        let queryString = new URLSearchParams(queryStringParams).toString();
        const jobDetailsUrl = queryString ? `/api/job/job_details?${queryString}` : '/api/job/job_details/';

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
          notify: data.metaData?.notificationSettings?.notify,
          notificationSuccessMessage: data.metaData?.notificationSettings?.successMessage,
          notificationFailureMessage: data.metaData?.notificationSettings?.failureMessage,
          notificationRecipients: data.metaData?.notificationSettings?.recipients,
        });

        return data;
      } catch (error) {
        console.log('error getJobDetails', error);
        this.setState({ initialDataLoading: false });
      } finally {
        this.handleViewOnlyMode();
      }
    }
  }

  async getFiles({ applicationId }) {
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

  handleOk = async () => {
    const form = this.formRef.current;
    const { onClose, history, application, inTabView } = this.props;

    try {
      const fields = await form.validateFields();
      this.setState({ confirmLoading: true });
      const saveResponse = await this.saveJobDetails();
      message.success(`${fields.name} saved`);

      if (onClose) {
        // THIS METHOD WILL PASS PROPS TO GRAPH!
        const isAssociated =
          form.getFieldValue('jobSelected') ||
          form.getFieldValue('isAssociated') ||
          form.getFieldValue('isStoredOnGithub') ||
          form.getFieldValue('jobType') === 'Manual';
        // if job is newly associated jobSelected value is gonna be true, if it is undefined we will fall-back to isAssociated value, if it is true it mean that job was previously associated, if it is falsy, then we have no associations yet;
        const resultToGraph = {
          isAssociated,
          assetId: saveResponse.jobId,
          name: form.getFieldValue('name'),
          title: form.getFieldValue('title'),
        };

        return onClose(resultToGraph);
      }

      if (history) {
        return history.push(`/${application.applicationId}/assets`);
      } else {
        if (inTabView) {
          const { updateTab, key } = inTabView;
          updateTab({ status: 'saved', key });
          this.switchToViewOnly();
        }
      }
    } catch (error) {
      console.log('handleOk error', error);
      let errorMessage = error?.message || 'Please check your fields for errors';
      if (error?.errorFields) errorMessage = error.errorFields[0].errors[0];

      if (inTabView) {
        const { updateTab, key, value } = inTabView;
        updateTab({ status: 'error', key });
        // Add a Job name to error message;
        errorMessage = `"${value}": ${errorMessage}`;
      }

      message.error(errorMessage);
    }
    this.setState({ confirmLoading: false });
  };

  handleDelete = async () => {
    try {
      const { history, onDelete, currentlyEditingNode, application, selectedAsset } = this.props;

      await handleJobDelete(selectedAsset.id, application.applicationId);

      onDelete ? onDelete(currentlyEditingNode) : history.push('/' + application.applicationId + '/assets');

      message.success('Job deleted successfully');
    } catch (error) {
      console.log(error);
      message.error('There was an error deleting the Job file');
    }
  };

  async saveJobDetails() {
    try {
      const payload = {
        method: 'POST',
        headers: authHeader(),
        //!! isNew: this.props.isNew, id: this.state.job.id = NOT IN USE
        body: JSON.stringify({ isNew: this.props.isNew, id: this.state.job.id, job: await this.populateJobDetails() }),
      };

      const response = await fetch('/api/job/saveJob', payload);
      if (!response.ok) handleError(response);

      return await response.json();
    } catch (error) {
      console.log('saveJobDetails error', error);
      // pass error to parent function, we will use snackbar info from there
      throw error;
    } finally {
      this.setState({ confirmLoading: false });
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

    const {
      gitHubFiles,
      isStoredOnGithub,
      jobSelected,
      manualJobFilePath,
      removeAssetId,
      renameAssetId,
      ...formFields
    } = formFieldsValue;
    //Based on this value we will save or not coresponding job data;
    let isAssociated = formFieldsValue.isAssociated || jobSelected || isStoredOnGithub;
    // Metadata will be stored as JSON we use this object for notifications, github configs and more...
    const metaData = {};
    // MANUAL JOB RELATED CODE
    if (formFieldsValue['jobType'] === 'Manual') {
      metaData.manualJobs = {
        pathToFile: manualJobFilePath || [],
      };
      isAssociated = true;
    }
    // IF JOB IS NOT ASSIGN TO ANY JOB ON HPCC IT IS CONSIDERED DESIGNJOB!
    metaData.isAssociated = isAssociated;
    // GITHUB RELATED CODE
    metaData.isStoredOnGithub = isStoredOnGithub;
    metaData.gitHubFiles = !isStoredOnGithub
      ? null
      : {
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
        ecl: !isAssociated ? '' : this.state.job.ecl,
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
      renameAssetId, // Asset was a design job that got associated with none-existing in DB job
    };

    return jobDetails;
  }

  handleCancel = () => {
    this.setState({ visible: false });
    if (this.props.history) {
      this.props.history.push('/' + this.props.application.applicationId + '/assets');
    } else {
      this.props.onClose();
    }
  };

  executeJob = async () => {
    try {
      this.setState({ initialDataLoading: true });

      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          jobId: this.state.job.id,
          jobName: this.formRef.current.getFieldValue('name'),
          clusterId: this.state.selectedCluster || this.formRef.current.getFieldValue('clusters'),
          dataflowId: this.props.selectedDataflow?.id || '',
          dataflowVersionId: this.props.selectedDataflow?.versionId,
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
      message.error(error.message);
    }
    this.setState({ initialDataLoading: false });
  };

  // this func will be passed as prop to update JobDetails state, and it should be a wrapper func like this, because react gonna give us error if we pass this.setState straight forward,
  // TypeError: Cannot read property 'updater' of undefined
  updateState = (values) => this.setState(values);
  hideTab = (jobType) => ['Script', 'Spray', 'Manual'].includes(jobType);
  onClusterSelection = (value) => this.setState({ selectedCluster: value });
  onJobTypeChange = (value) => this.setState({ job: { ...this.state.job, jobType: value } });
  handleViewOnlyMode = () => this.setState({ enableEdit: false, editing: false, addingNewAsset: false });
  //Switch to view only mode
  switchToViewOnly = () => this.setState({ enableEdit: !this.state.enableEdit, editing: false, dataAltered: true });

  render() {
    const { application, displayingInModal, inTabView, isNew, selectedAsset, match, selectedDataflow } = this.props;
    const { job, enableEdit, selectedTabPaneKey } = this.state;
    const editingAllowed = hasEditPermission(this.props.user);
    const { name, ecl, jobType } = job;

    const scheduleProps = {
      editingAllowed,
      nodes: this.props.nodes,
      readOnly: this.props.viewMode,
      dataflowId: selectedDataflow?.id,
      addToSchedule: this.props.addToSchedule, // method passed from graph to add schedule to graphs
      selectedAsset: this.props.selectedAsset,
      applicationId: application?.applicationId || match?.params?.applicationId,
    };

    const commonProps = {
      enableEdit,
      editingAllowed,
      state: this.state,
      props: this.props,
      form: this.formRef,
      setState: this.updateState,
    };

    const controlProps = {
      handleOk: this.handleOk,
      executeJob: this.executeJob,
      handleCancel: this.handleCancel,
      handleDelete: this.handleDelete,
    };

    const noECLAvailable = this.formRef.current?.getFieldValue('isStoredOnGithub') && !job.ecl;

    //render only after fetching the data from the server
    if (!name && !selectedAsset && !isNew) return null;

    //JSX
    return (
      <>
        <JobForm {...commonProps}>
          <Tabs
            type="card"
            defaultActiveKey={selectedTabPaneKey}
            tabBarExtraContent={displayingInModal ? null : <Controls {...commonProps} {...controlProps} />}
            onChange={(activeKey) => this.setState({ selectedTabPaneKey: activeKey })}>
            <TabPane tab={<Text text="Basic" />} key="1">
              <JobBasicTab {...commonProps} />
            </TabPane>

            {this.hideTab(jobType) ? null : (
              <TabPane tab="ECL" disabled={noECLAvailable} key="2">
                <MonacoEditor lang="ecl" value={ecl} targetDomId={`job-${inTabView?.key || ''}`} />
              </TabPane>
            )}

            {jobType !== 'Script' ? null : (
              <TabPane disabled={noECLAvailable} tab={<Text text="Script" />} key="2">
                <ScriptTab {...commonProps} />
              </TabPane>
            )}

            {this.hideTab(jobType) ? null : (
              <>
                <TabPane disabled={noECLAvailable} tab={<Text text="Input Params" />} key="3">
                  <InputParamsTab {...commonProps} />
                </TabPane>

                <TabPane disabled={noECLAvailable} tab={<Text text="Input Files" />} key="4">
                  <InputOutoutFiles type="input" label="Input Files" {...commonProps} />
                </TabPane>

                <TabPane tab={<Text text="Output Files" />} disabled={noECLAvailable} key="5">
                  <InputOutoutFiles type="output" label="Output Files" {...commonProps} />
                </TabPane>
              </>
            )}

            {!selectedDataflow ? null : (
              <TabPane tab={<Text text="Schedule" />} key="6">
                <ScheduleTab {...scheduleProps} />
              </TabPane>
            )}

            {isNew ? null : (
              <TabPane tab={<Text text="Workflows" />} key="7">
                <AssociatedDataflows assetId={job.id} assetType={'Job'} />
              </TabPane>
            )}
          </Tabs>
        </JobForm>
        {!displayingInModal ? null : <Controls modalControls={true} {...commonProps} {...controlProps} />}
      </>
    );
  }
}

function mapStateToProps(state, ownProps) {
  let { selectedAsset, newAsset = {}, clusterId } = state.assetReducer;
  const { application, clusters } = state.applicationReducer;
  const { user } = state.authenticationReducer;
  let { isNew = false, groupId = '' } = newAsset;

  if (ownProps.selectedAsset) selectedAsset = ownProps.selectedAsset;

  return { user, selectedAsset, application, isNew, groupId, clusterId, clusters };
}

// Forward ref will give us ability to add ref to this component with AddJobs wrapper, so we can call savejobs method on all instances at once.
let JobDetailsForm = connect(mapStateToProps, null, null, { forwardRef: true })(JobDetails);
export default JobDetailsForm;
