import {
  AutoComplete,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  message,
  Radio,
  Row,
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { debounce } from 'lodash';
import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import { connect } from 'react-redux';
import ConstraintsTags from '../../admin/Compliance/Constraints/ConstraintsTags';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { canViewPII, hasEditPermission } from '../../common/AuthUtil.js';
import { formItemLayout } from '../../common/CommonUtil';
// import { validationRuleFixes, validationRules } from '../common/CommonUtil.js';
import DeleteAsset from '../../common/DeleteAsset';
import EditableTable from '../../common/EditableTable.js';
import LayoutTable from '../../common/LayoutTable.js';
import MonacoEditor from '../../common/MonacoEditor.js';
import OverwriteAssetModal from '../../common/OverWriteAssetModal';
import SuperFileMeta from '../../common/SuperFileMeta';
import AssociatedDataflows from '../AssociatedDataflows';
import Text, { i18n } from '../../common/Text.jsx';
import FileExplorerModal from './FileExplorerModal';

const TabPane = Tabs.TabPane;
const Option = Select.Option;

message.config({ top: 130 });
class FileDetails extends Component {
  formRef = React.createRef();

  state = {
    visible: true,
    confirmLoading: false,
    loading: false,
    rules: [],
    clusters: [],
    consumers: [],
    selectedCluster: this.props.clusterId || '',
    drawerVisible: false,
    fileColumns: [],
    fileDataContent: [],
    complianceTags: [],
    fileSearchValue: '',
    complianceDetails: [],
    fileSearchErrorShown: false,
    disableReadOnlyFields: false,
    initialDataLoading: false,
    fileSearch: {
      data: [],
      loading: false,
      error: '',
    },
    showFilePreview: false,
    file: {
      id: '',
      groupId: '',
      fileType: 'thor_file',
      layout: [],
      licenses: [],
      relations: [],
      validations: [],
      isAssociated: false,
    },
    existingAsset: {
      showModal: false,
      dbAsset: null,
      selectedAsset: {
        id: '',
        name: '',
      },
    },
    addingNewAsset: false,
    enableEdit: false,
    editing: false,
    dataAltered: false,
    errors: false,
    fileExplorerVisible: false,
  };

  //Component did mount
  async componentDidMount() {
    const applicationId = this.props.application?.applicationId || this.props.match?.params?.applicationId;

    const assetId = this.props?.selectedAsset?.id || this.props.match?.params?.assetId;
    if (!assetId) this.setState({ addingNewAsset: true, enableEdit: true, editing: true });

    if (applicationId) {
      await this.getFileDetails({ assetId, applicationId });
    }
  }

  //Component will unmount
  componentWillUnmount() {}

  clearState = () => {
    this.setState({
      complianceTags: [],
      fileDataContent: [],
      fileColumns: [],
      fileSearchValue: '',
      selectedCluster: '',
      disableReadOnlyFields: false,
      file: {
        ...this.state.file,
        id: '',
        fileType: 'thor_file',
        layout: [],
        licenses: [],
        relations: [],
        validations: [],
      },
    });
    this.formRef.current.resetFields();
  };

  // Browser file explorer functions ############
  browseLogicalFile = () => {
    if (this.state.selectedCluster) {
      this.setState({ fileExplorerVisible: true });
    } else {
      message.info('Please select cluster before searching');
    }
  };

  cancelLogicalFileExplorerModal = () => {
    this.setState({ fileExplorerVisible: false });
  };

  doneSelectingLogicalFile = (selectedFile) => {
    this.onFileSelected(selectedFile);
    this.setState({ fileSearchValue: selectedFile, fileExplorerVisible: false });
  };
  // End of Browser file explorer functions ########

  getFileDetails = async ({ assetId, applicationId }) => {
    if (assetId) {
      this.setState({ initialDataLoading: true });

      // CREATING REQUEST URL TO GET JOB DETAILS
      const queryStringParams = {};
      if (assetId) queryStringParams['file_id'] = assetId;
      if (applicationId) queryStringParams['app_id'] = applicationId;
      if (this.props.selectedDataflow) queryStringParams['dataflow_id'] = this.props.selectedDataflow.id;

      try {
        let queryString = new URLSearchParams(queryStringParams).toString();
        const fileDetailsUrl = queryString
          ? `/api/file/read/file_details?${queryString}`
          : '/api/file/read/file_details/';
        const response = await fetch(fileDetailsUrl, { headers: authHeader() });
        if (!response.ok) handleError(response);

        const data = await response.json();

        if (!data?.basic) throw data;

        const fileType = !data.basic.fileType || data.basic.fileType === 'flat' ? 'thor_file' : data.basic.fileType;

        this.setState({
          initialDataLoading: false,
          disableReadOnlyFields: true,
          selectedCluster: data.basic.cluster_id,
          file: {
            ...this.state.file,
            id: data.basic.id,
            fileType: fileType,
            name: data.basic.name,
            owner: data.basic.owner,
            groupId: data.basic.groupId,
            supplier: data.basic.supplier,
            consumer: data.basic.consumer,
            relations: data.file_relations,
            validations: data.file_validations,
            isSuperFile: data.basic.isSuperFile,
            description: data.basic.description,
            superFileData: data.basic.superFileData,
            layout: data.basic?.metaData?.layout || [],
            licenses: data.basic?.metaData?.licenses || [],
            isAssociated: data.basic?.metaData?.isAssociated,
          },
        });

        this.formRef.current?.setFieldsValue({
          fileType: fileType,
          name: data.basic.name,
          scope: data.basic.scope,
          owner: data.basic.owner,
          title: data.basic.title,
          supplier: data.basic.supplier,
          consumer: data.basic.consumer,
          selectedAssetId: data.basic.id,
          clusters: data.basic.cluster_id,
          serviceURL: data.basic.serviceUrl,
          isSuperFile: data.basic.isSuperFile,
          description: data.basic.description,
          qualifiedPath: data.basic.qualifiedPath,
          isAssociated: data.basic?.metaData?.isAssociated,
          constraints: data.basic?.metaData?.constraints || [],
        });

        await this.getFileData(data.basic.name, data.basic.cluster_id);

        return data;
      } catch (error) {
        console.log('-getFileDetails---------------------------');
        console.dir({ error }, { depth: null });
        console.log('------------------------------------------');
        this.setState({ initialDataLoading: false });
        message.error('File details could not be found. Please check if the file exists in Assets');
      }
    }
  };

  handleOk = async (e) => {
    try {
      e.preventDefault();
      await this.formRef.current.validateFields();
      this.setState({ confirmLoading: true });
      const saveResponse = await this.saveFileDetails();
      if (this.props.onClose) {
        // THIS METHOD WILL PASS PROPS TO GRAPH!
        const isAssociated =
          this.formRef.current?.getFieldValue('fileSelected') || this.formRef.current?.getFieldValue('isAssociated');

        const resultToGraph = {
          ...saveResponse,
          isAssociated,
          assetId: saveResponse.fileId,
          name: this.formRef.current?.getFieldValue('name'),
          title: this.formRef.current?.getFieldValue('title'),
        };

        return this.props.onClose(resultToGraph);
      }

      if (this.props.history) {
        return this.props.history.push(`/${this.props.application.applicationId}/assets`);
      } else {
        document.querySelector('button.ant-modal-close').click();
      }
    } catch (error) {
      console.log('handleOk error', error);
      let errorMessage = error?.message || 'Please check your fields for errors';
      if (error?.errorFields) errorMessage = error.errorFields[0].errors[0];

      message.error(errorMessage);
    }
    this.setState({ confirmLoading: false });
  };

  handleDelete = async () => {
    try {
      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          fileId: this.props.selectedAsset.id,
          application_id: this.props.application.applicationId,
        }),
      };

      const response = await fetch('/api/file/read/delete', options);
      if (!response.ok) handleError(response);

      if (this.props.onDelete) {
        this.props.onDelete(this.props.currentlyEditingNode);
      } else {
        this.props.history.push('/' + this.props.application.applicationId + '/assets');
      }

      message.success('File deleted successfully');
      this.setState({ visible: false, confirmLoading: false });
    } catch (error) {
      console.log(error);
      message.error('There was an error deleting the file');
    }
  };

  searchFiles = debounce(async (searchString) => {
    if (searchString.length <= 3) return;
    if (!this.state.selectedCluster) return message.info('Please select cluster before searching');
    if (!searchString.match(/^[a-zA-Z0-9:_-]*$/)) {
      return message.error('Invalid search keyword. Please remove any special characters from the keyword.');
    }
    try {
      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          keyword: searchString,
          clusterid: this.state.selectedCluster,
        }),
      };

      this.setState({ fileSearch: { ...this.state.fileSearch, loading: true, error: '' } });
      const response = await fetch('/api/hpcc/read/filesearch', options);
      if (!response.ok) handleError(response);

      const suggestions = await response.json();
      this.setState({ fileSearch: { ...this.state.fileSearch, loading: false, data: suggestions } });
    } catch (error) {
      this.setState({ fileSearch: { ...this.state.fileSearch, loading: false, error: error.message } });
      message.error('There was an error searching the files from cluster');
    }
  }, 500);

  onFileSelected = async (selectedSuggestion) => {
    message.config({ top: 150 });
    try {
      this.setState({ initialDataLoading: true });
      const url =
        '/api/hpcc/read/getFileInfo?fileName=' +
        selectedSuggestion +
        '&clusterid=' +
        this.state.selectedCluster +
        '&applicationId=' +
        this.props.application.applicationId;
      const response = await fetch(url, { headers: authHeader() });
      if (!response.ok) handleError(response);

      const fileInfo = await response.json();

      if (fileInfo.basic?.groups?.filter((group) => group.id === this.props.groupId)?.length > 0) {
        return message.error('There is already a file with the same name in this Group. Please select another file');
      }

      const isExistingFile = fileInfo.basic.id ? true : false;
      const selectedAssetId = this.formRef.current?.getFieldValue('selectedAssetId');
      const fileName = this.formRef.current?.getFieldValue('name');
      const title = this.formRef.current?.getFieldValue('title');

      const fileType =
        !fileInfo.basic.fileType || fileInfo.basic.fileType === 'flat' ? 'thor_file' : fileInfo.basic.fileType;

      let fieldsToUpdate = {
        title: title || fileInfo.basic.name.substring(fileInfo.basic.name.lastIndexOf('::') + 2),
        fileType: fileType,
        fileSelected: true, // IF FILE WAS SELECTED AND SAVED AS SELECTED THEN WE ASSUME THAT FILE IS ASSOCIATED!
        name: fileInfo.basic.name,
        scope: fileInfo.basic.scope,
        owner: fileInfo.basic.owner,
        consumer: fileInfo.basic.consumer,
        supplier: fileInfo.basic.supplier,
        serviceURL: fileInfo.basic.serviceUrl,
        qualifiedPath: fileInfo.basic.pathMask,
        isSuperFile: fileInfo.basic.isSuperFile,
      };

      if (selectedAssetId) {
        // is selectedAssetId exist it means that FILE WAS CREATED BUT WITH NO ASSOCIATION, makes it a design job...
        this.setState({ initialDataLoading: false }); // will update local loading indicator
        // HPCC JOB ALREADY EXISTS IN TOMBOLO, ASK USE TO OVERWRITE METADATA
        if (isExistingFile)
          return this.setState({
            existingAsset: {
              showModal: true,
              dbAsset: fileInfo.basic,
              selectedAsset: { name: fileName, id: selectedAssetId },
            },
          });
        // HPCC FILE DOES NOT EXISTS IN TOMBOLO, associate this design job and Rename this file according to value found on HPCC;
        fieldsToUpdate.renameAssetId = fileName !== fileInfo.basic.name ? selectedAssetId : '';
      }

      if (isExistingFile) {
        // Job existed in DB, add additional fields;
        // Adding additional fields when selecting existing job while creating job from scratch;
        fieldsToUpdate = {
          ...fieldsToUpdate,
          description: fileInfo.basic.description,
        };
      }

      this.setState({
        initialDataLoading: false,
        disableReadOnlyFields: true,
        file: {
          ...this.state.file,
          fileType,
          id: fileInfo.basic.id,
          layout: fileInfo.basic?.metaData?.layout,
          validations: fileInfo.file_validations,
        },
      });

      this.formRef.current.setFieldsValue(fieldsToUpdate);

      await this.getFileData(fileInfo.basic.name, this.state.selectedCluster);
    } catch (error) {
      console.log('-error------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      message.error('There was an error getting file information from the cluster. Please try again');
      this.setState({ initialDataLoading: false });
    }
  };

  resetModal = () =>
    this.setState({ existingAsset: { showModal: false, dbAsset: null, selectedAsset: { id: '', name: '' } } });

  acceptExistingSettings = () => {
    const { dbAsset, selectedAsset } = this.state.existingAsset;
    // this method is triggered when we selected existing settings, we will overwrite most of the previous settings with the one that we have in db
    const updateFields = {
      fileSelected: true, // IF FILE WAS SELECTED AND SAVED AS SELECTED THEN WE ASSUME THAT FILE IS ASSOCIATED!
      name: dbAsset.name,
      scope: dbAsset.scope,
      owner: dbAsset.owner,
      title: dbAsset.title,
      consumer: dbAsset.consumer,
      supplier: dbAsset.supplier,
      fileType: dbAsset.fileType,
      serviceURL: dbAsset.serviceUrl,
      isSuperFile: dbAsset.isSuperFile,
      description: dbAsset.description,
      qualifiedPath: dbAsset.pathMask,
      removeAssetId: selectedAsset.id, // We want to assign existing job to this design job, we will need to remove design job to avoid duplications
    };

    this.formRef.current.setFieldsValue(updateFields);

    this.setState({ file: { ...this.state.file, ...dbAsset } });
    this.resetModal();
  };

  acceptIncomingSettings = () => {
    const { dbAsset, selectedAsset } = this.state.existingAsset;
    // this method is triggered when we selected incoming settings, we will just update missing values, no overwrites.
    const updateFields = {
      fileSelected: true, // IF JOB SELECTED THEN ITS NO LONGER DESIGNER JOB!
      name: dbAsset.name,
      removeAssetId: selectedAsset.id, // We want to assign existing job to this design job, we will need to remove design job to avoid duplications
    };

    this.formRef.current.setFieldsValue(updateFields);
    this.setState({ file: { ...this.state.file, name: dbAsset.name } }); // will update state in FileDetails ||  JobDetails;
    this.resetModal();
  };

  saveFileDetails = async () => {
    try {
      const payload = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          isNew: this.props.isNew,
          id: this.state.file.id,
          file: await this.populateFileDetails(),
        }),
      };

      const response = await fetch('/api/file/read/savefile', payload);
      if (!response.ok) handleError(response);

      message.success('Data saved');
      return await response.json();
    } catch (error) {
      console.log('saveFileDetails error', error);
      message.error('Error occurred while saving the data. Please check the form data');
    }
  };

  getFileData = async (fileName, clusterId) => {
    try {
      // do not reuest data if user has wrong permission
      const canVIewData = canViewPII(this.props.user);
      if (!canVIewData) return;

      if (!clusterId || !fileName) throw new Error('Filename or ClusterId is not provided');

      const response = await fetch('/api/hpcc/read/getData?fileName=' + fileName + '&clusterid=' + clusterId, {
        headers: authHeader(),
      });
      if (!response.ok) handleError(response);

      const rows = await response.json();

      if (rows?.length > 0) {
        this.setState({
          fileColumns: Object.keys(rows[0]).map((field) => ({ title: field, dataIndex: field })),
          fileDataContent: rows,
          showFilePreview: true,
        });
      }
    } catch (error) {
      console.log('-getFileData-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      this.setState({ showFilePreview: false });
    }
  };

  populateFileDetails = async () => {
    const formFieldsValue = this.formRef.current.getFieldsValue(); // will get all mounted fields value

    const fileDetails = {
      app_id: this.props.application.applicationId,
      basic: {
        name: formFieldsValue.name,
        title: formFieldsValue.title,
        scope: formFieldsValue.scope,
        owner: formFieldsValue.owner,
        supplier: formFieldsValue.supplier,
        consumer: formFieldsValue.consumer,
        fileType: formFieldsValue.fileType,
        cluster_id: formFieldsValue.clusters,
        serviceURL: formFieldsValue.serviceURL,
        description: formFieldsValue.description,
        dataflowId: this.props.selectedDataflow?.id || '',
        qualifiedPath: formFieldsValue.qualifiedPath,
        application_id: this.props.application.applicationId,
        groupId: this.props.groupId || this.state.file.groupId,
        metaData: {
          layout: this.state.file.layout,
          licenses: this.state.file.licenses,
          constraints: this.formRef.current.getFieldValue('constraints') || [],
          isAssociated: this.formRef.current.getFieldValue('fileSelected') || this.state.file.isAssociated, // field is not mounted so we take value separately
        },
      },

      validation: this.state.file.validations,
      removeAssetId: this.formRef.current.getFieldValue('removeAssetId') || '', // Asset was a design file that got associated with existing in DB file
      renameAssetId: this.formRef.current.getFieldValue('renameAssetId') || '', // Asset was a design file that got associated with none-existing in DB file
    };
    return fileDetails;
  };

  handleCancel = () => {
    this.setState({ visible: false });
    if (this.props.history) {
      this.props.history.push('/' + this.props.application.applicationId + '/assets');
    } else {
      this.props.onClose(); //document.querySelector('button.ant-modal-close').click();
    }
  };

  onChange = (e) => this.setState({ file: { ...this.state.file, [e.target.name]: e.target.value } });
  toggleEdit = () =>
    this.setState({ enableEdit: !this.state.enableEdit, editing: !this.state.editing, dataAltered: true });
  onCheckbox = (e) => this.setState({ file: { ...this.state.file, [e.target.id]: e.target.checked } });
  fileTypeChange = (e) => this.setState({ file: { ...this.state.file, fileType: e.target.value } });
  setLayoutData = (data) => this.setState({ file: { ...this.state.file, layout: data } });
  setValidationData = (data) => this.setState({ file: { ...this.state.file, validations: data } });
  onOwnerSelection = (value) => this.setState({ file: { ...this.state.file, owner: value } });
  onClusterSelection = (value) => this.setState({ selectedCluster: value });
  onSupplierSelection = (value) => this.setState({ file: { ...this.state.file, supplier: value } });
  onConsumerSelection = (value) => this.setState({ file: { ...this.state.file, consumer: value } });

  getScope = () => {
    const scope = `${this.props.user.organization}::${this.props.applicationTitle}${
      this.state.file.title ? '::' + this.state.file.title : ''
    }`.toLowerCase();
    this.setState({ file: { ...this.state.file, scope } });
  };

  onFieldsChange = (changedFields, allFields) => {
    const inputErrors = allFields.filter((item) => item.errors.length > 0);
    this.setState({ dataAltered: true, errors: inputErrors.length > 0 });
  };

  parseFileData = () => {
    if (!this.state.showFilePreview) return [];

    const data = [];

    this.state.fileDataContent.forEach((record, index) => {
      let newRecord = { ...record, id: index };
      this.state.fileColumns.forEach((column) => {
        const recordType1 = record?.[column]?.Row;
        const recordType2 = record?.[column];
        if (recordType1) {
          newRecord[column] = recordType1?.[0][column];
        } else if (recordType2 instanceof Object) {
          newRecord[column] = recordType2[column][column];
        }
      });
      data.push(newRecord);
    });

    return data;
  };

  getConstraints = (type) => {
    if (type === 'file') return this.formRef.current?.getFieldValue('constraints')?.map((id) => ({ id })) || [];

    const layout = this.state.file.layout;

    const allConstraints = layout.reduce((acc, field) => {
      const { own = [], inherited = [] } = field.constraints;
      if (own.length > 0) acc.push(...own);
      if (inherited.length > 0) acc.push(...inherited);
      return acc;
    }, []);

    const noDuplicates = this.dedupe(allConstraints);

    return noDuplicates;
  };

  dedupe = (allConstraints) => {
    const result = allConstraints.reduce(
      (acc, el) => {
        if (!acc.ids[el.id]) {
          acc.ids[el.id] = true;
          acc.constraints.push(el);
        }
        return acc;
      },
      { ids: {}, constraints: [] }
    );

    return result.constraints;
  };

  render() {
    const { enableEdit, addingNewAsset, complianceTags, showFilePreview, confirmLoading, disableReadOnlyFields } =
      this.state;
    const { description, isSuperFile, layout, validations, superFileData } = this.state.file;

    const VIEW_DATA_PERMISSION = canViewPII(this.props.user);
    const editingAllowed = hasEditPermission(this.props.user) || !this.props.viewMode;

    const validationRuleColumns = [
      {
        title: <Text text="Field" />,
        dataIndex: 'rule_field',
        celleditor: 'select',
        editable: editingAllowed,
        width: '15%',
        celleditorparams: {
          values: this.state.file?.fileColumn?.map((el) => el?.name),
        },
      },
      {
        title: <Text text="Rule Name" />,
        dataIndex: 'rule_name',
        editable: editingAllowed,
        celleditor: 'select',
        celleditorparams: {
          values: this.validationRules,
        },
        width: '15%',
      },
      {
        title: <Text text="Rule" />,
        dataIndex: 'rule_test',
        editable: editingAllowed,
        width: '15%',
      },
      {
        title: <Text text="Fix" />,
        dataIndex: 'rule_fix',
        celleditor: 'select',
        editable: editingAllowed,
        celleditorparams: {
          values: this.validationRuleFixes,
        },
        width: '15%',
      },
    ];

    const licenseColumns = [
      {
        title: <Text text="Name" />,
        dataIndex: 'name',
        width: '20%',
        filters: [
          {
            text: 'Show matched only',
            value: 'match',
          },
        ],
        onFilter: (value, record) => this.state.file.licenses.includes(record.id),
        shouldCellUpdate: () => false,
        render: (text, record) => {
          return (
            <Typography.Link target="_blank" href={record.url}>
              {text}
            </Typography.Link>
          );
        },
      },
      {
        title: <Text text="Description" />,
        dataIndex: 'description',
        shouldCellUpdate: () => false,
      },
    ];

    const ComplianceInfo = (complianceTags) => {
      if (!complianceTags?.tags?.length) return null;
      const tagElem = complianceTags.tags.map((tag) => (
        <Tag color="red" key={tag}>
          {tag}
        </Tag>
      ));
      return (
        <div style={{ paddingBottom: '5px' }}>
          <b>Compliance:</b> {tagElem}
        </div>
      );
    };

    //Controls
    const controls = (
      <div
        className={this.props.displayingInModal ? 'assetDetail-buttons-wrapper-modal' : 'assetDetail-buttons-wrapper'}>
        {!enableEdit && editingAllowed ? (
          <Button type="primary" onClick={this.toggleEdit}>
            {<Text text="Edit" />}
          </Button>
        ) : null}
        {enableEdit ? <Button onClick={this.toggleEdit}>{<Text text="View Changes" />}</Button> : null}

        <span className="button-container">
          {enableEdit ? (
            <DeleteAsset
              asset={{
                id: this.state.file.id,
                type: 'File',
                title: this.formRef.current?.getFieldValue('title') || this.formRef.current?.getFieldValue('name'),
              }}
              style={{ display: 'inline-block' }}
              onDelete={this.handleDelete}
              component={
                <Button key="danger" disabled={!this.state.file.id || !editingAllowed} type="danger">
                  {<Text text="Delete" />}
                </Button>
              }
            />
          ) : null}
          {this.state.dataAltered ? (
            <span style={{ marginLeft: '25px' }}>
              <Button key="back" onClick={this.handleCancel} type="primary" ghost>
                {<Text text="Cancel" />}
              </Button>
              <Button
                key="submit"
                type="primary"
                onClick={this.handleOk}
                loading={confirmLoading}
                style={{ background: 'var(--success)' }}
                disabled={!editingAllowed || this.state.errors}>
                {<Text text="Save" />}
              </Button>
            </span>
          ) : (
            <Button ghost key="back" type="primary" onClick={this.handleCancel}>
              {<Text text="Cancel" />}
            </Button>
          )}
        </span>
      </div>
    );

    const { selectedConsumer, selectedSupplier, selectedOwner, consumers, suppliers, owners } =
      this.props.consumers.reduce(
        (acc, el) => {
          if (el.assetType === 'Consumer') {
            acc.consumers.push(el);
            if (el.id === this.state.file.consumer) acc.selectedConsumer = el.name;
          }
          if (el.assetType === 'Supplier') {
            acc.suppliers.push(el);
            if (el.id === this.state.file.supplier) acc.selectedSupplier = el.name;
          }
          if (el.assetType === 'Owner') {
            acc.owners.push(el);
            if (el.id === this.state.file.owner) acc.selectedOwner = el.name;
          }
          return acc;
        },
        { selectedConsumer: '', selectedSupplier: '', selectedOwner: '', consumers: [], suppliers: [], owners: [] }
      );

    const clusterName = this.props.clusters?.find(
      (cluster) => cluster.id === this.formRef.current?.getFieldValue('clusters')
    )?.name;
    const fileName = this.formRef.current?.getFieldValue('name') || '';
    const isAssociated = this.formRef.current?.getFieldValue('isAssociated'); // this value is assign only at the time of saving job. if it is true - user can not change it.
    // Make labels spacing a little wider for in modal view
    this.props.displayingInModal ? (formItemLayout.labelCol.span = 3) : (formItemLayout.labelCol.span = 2);

    let hideOnReadOnlyView = !enableEdit || !addingNewAsset;
    if (enableEdit && !isAssociated) hideOnReadOnlyView = false;

    return (
      <React.Fragment>
        <FileExplorerModal
          open={this.state.fileExplorerVisible}
          onCancel={this.cancelLogicalFileExplorerModal}
          onDone={this.doneSelectingLogicalFile}
          cluster={this.state.selectedCluster}
        />

        {this.props.displayingInModal || this.state.addingNewAsset ? null : (
          <div className="assetTitle">
            <Text text="File" /> : {this.state.file.name}
          </div>
        )}
        <div
          className={
            this.props.displayingInModal ? 'assetDetails-content-wrapper-modal' : 'assetDetails-content-wrapper'
          }>
          <Tabs defaultActiveKey="1" tabBarExtraContent={this.props.displayingInModal ? null : controls}>
            <TabPane tab={<Text text="Basic" />} key="1">
              <Spin spinning={this.state.initialDataLoading}>
                <Form
                  initialValues={{ fileType: 'thor_file', isSuperFile: false }}
                  {...formItemLayout}
                  colon={enableEdit ? true : false}
                  labelAlign="left"
                  ref={this.formRef}
                  onFinish={this.handleOk}
                  onFieldsChange={this.onFieldsChange}>
                  <Form.Item label={<Text text="Type" />} name="fileType">
                    {!enableEdit ? (
                      <Typography.Text disabled={!this.state.file.fileType} style={{ paddingLeft: '11px' }}>
                        {this.state.file.fileType || 'File type not provided'}
                      </Typography.Text>
                    ) : (
                      <Radio.Group onChange={this.fileTypeChange}>
                        <Radio value={'thor_file'}>Thor File</Radio>
                        <Radio value={'csv'}>CSV</Radio>
                        <Radio value={'json'}>JSON</Radio>
                        {/*<Radio value={"xml"}>XML</Radio>*/}
                      </Radio.Group>
                    )}
                  </Form.Item>

                  <Form.Item label={<Text text="Cluster" />}>
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        {!enableEdit ? (
                          <Typography.Text disabled={!clusterName} style={{ paddingLeft: '11px' }}>
                            {clusterName || <Text text="Cluster is not provided" />}
                          </Typography.Text>
                        ) : (
                          <Form.Item noStyle name="clusters">
                            <Select allowClear disabled={isAssociated} onChange={this.onClusterSelection}>
                              {this.props.clusters.map((cluster) => (
                                <Option key={cluster.id}>{cluster.name}</Option>
                              ))}
                            </Select>
                          </Form.Item>
                        )}
                      </Col>
                    </Row>
                  </Form.Item>
                  <Form.Item label={<Text text="File" />} name="fileSearchValue" hidden={hideOnReadOnlyView}>
                    <Row gutter={[8, 0]}>
                      <Col span={20}>
                        <AutoComplete
                          className="certain-category-search"
                          popupClassName="certain-category-search-dropdown"
                          popupMatchSelectWidth={false}
                          dropdownStyle={{ width: 300 }}
                          style={{ width: '100%' }}
                          onSearch={this.searchFiles}
                          onSelect={this.onFileSelected}
                          allowClear={true}
                          onClear={this.clearState}
                          value={this.state.fileSearchValue}
                          onChange={(value) => this.setState({ fileSearchValue: value })}
                          placeholder={i18n('Search files')}
                          disabled={!editingAllowed}
                          notFoundContent={this.state.fileSearch.loading ? <Spin /> : 'Not Found'}>
                          {this.state.fileSearch.data.map((suggestion) => (
                            <Option key={suggestion.text} value={suggestion.value}>
                              {suggestion.text}
                            </Option>
                          ))}
                          {/* <Input.Search placeholder={i18n('Search files')} /> */}
                        </AutoComplete>
                      </Col>
                      <Col span={4}>
                        <Button htmlType="button" block onClick={this.browseLogicalFile} type="primary">
                          {<Text text="Browse" />}
                        </Button>
                      </Col>
                    </Row>
                  </Form.Item>
                  <Form.Item
                    label={<Text text="Name" />}
                    name="name"
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                      { required: enableEdit ? true : false, message: 'Please enter a name' },
                      { pattern: new RegExp(/^[a-zA-Z0-9: .@_-]*$/), message: 'Please enter a valid name' },
                      {
                        max: 256,
                        message: 'Maximum of 256 characters allowed',
                      },
                    ]}
                    className={enableEdit ? null : 'read-only-input'}>
                    {!enableEdit ? (
                      <Typography.Text style={{ paddingLeft: '11px' }}>{fileName}</Typography.Text>
                    ) : (
                      <Input
                        disabled={disableReadOnlyFields || !editingAllowed}
                        className={!enableEdit ? 'read-only-input' : ''}
                        placeholder={enableEdit ? i18n('Name') : i18n('Name is not provided')}
                      />
                    )}
                  </Form.Item>
                  <Form.Item
                    name="title"
                    label={<Text text="Title" />}
                    validateTrigger={['onChange', 'onBlur']}
                    className={enableEdit ? null : 'read-only-input'}
                    rules={[
                      { required: enableEdit ? true : false, message: 'Please enter a title!' },
                      {
                        pattern: new RegExp(/^[ a-zA-Z0-9:@._-]*$/),
                        message: 'Please enter a valid Title. Title can have  a-zA-Z0-9:._- and space',
                      },
                      {
                        max: 256,
                        message: 'Maximum of 256 characters allowed',
                      },
                    ]}>
                    <Input
                      name="title"
                      placeholder={enableEdit ? i18n('Title') : i18n('Title is not provided')}
                      disabled={!editingAllowed}
                      className={!enableEdit ? 'read-only-input' : ''}
                    />
                  </Form.Item>
                  <Form.Item
                    name="scope"
                    label={<Text text="Scope" />}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                      { required: enableEdit },
                      {
                        max: 256,
                        message: 'Maximum of 256 characters allowed',
                      },
                    ]}>
                    <Input
                      disabled={isAssociated}
                      className={!enableEdit ? 'read-only-input' : ''}
                      placeholder={enableEdit ? i18n('Scope') : i18n('Scope is not provided')}
                    />
                  </Form.Item>
                  <Form.Item
                    name="serviceURL"
                    label={<Text text="Service URL" />}
                    className={enableEdit ? null : 'read-only-input'}
                    rules={[{ type: 'url', message: 'Please enter a valid URL' }]}>
                    <Input
                      disabled={!editingAllowed}
                      placeholder={enableEdit ? i18n('Service URL') : i18n('Service URL is not provided')}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<Text text="Path" />}
                    name="qualifiedPath"
                    className={!enableEdit ? 'read-only-input' : ''}
                    rules={[
                      {
                        pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                        message: 'Please enter a valid path',
                      },
                    ]}>
                    <Input
                      disabled={!editingAllowed}
                      placeholder={enableEdit ? i18n('Path') : i18n('Path is not provided')}
                    />
                  </Form.Item>
                  <Form.Item
                    label={<Text text="Is Super File" />}
                    name="isSuperFile"
                    valuePropName="checked"
                    className={!enableEdit ? 'read-only-input' : ''}>
                    {enableEdit ? (
                      <Checkbox
                        id="isSuperFile"
                        onChange={this.onCheckbox}
                        disabled={!editingAllowed}
                        checked={isSuperFile === true}
                      />
                    ) : (
                      <Typography.Text style={{ paddingLeft: '11px' }}>
                        {this.state.file.isSuperFile ? 'Yes' : 'No'}
                      </Typography.Text>
                    )}
                  </Form.Item>

                  <Form.Item
                    label={<Text text="Supplier" />}
                    name="supplier"
                    className={!enableEdit ? 'read-only-input' : ''}>
                    {!enableEdit ? (
                      <Typography.Text disabled={!selectedSupplier} style={{ paddingLeft: '11px' }}>
                        {selectedSupplier || <Text text="Supplier is not provided" />}
                      </Typography.Text>
                    ) : (
                      <Select
                        disabled={!editingAllowed}
                        onChange={this.onSupplierSelection}
                        value={this.state.file.supplier || ''}
                        placeholder={enableEdit ? i18n('Select a supplier') : i18n('Supplier is not provided')}>
                        {suppliers.map((supplier) => (
                          <Option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>

                  <Form.Item
                    label={<Text text="Consumer" />}
                    name="consumer"
                    className={!enableEdit ? 'read-only-input' : ''}>
                    {!enableEdit ? (
                      <Typography.Text disabled={!selectedConsumer} style={{ paddingLeft: '11px' }}>
                        {selectedConsumer || <Text text="Consumer is not provided" />}
                      </Typography.Text>
                    ) : (
                      <Select
                        disabled={!editingAllowed}
                        onChange={this.onConsumerSelection}
                        value={this.state.file.consumer || ''}
                        placeholder={enableEdit ? i18n('Select a consumer') : i18n('Consumer is not provided')}>
                        {consumers.map((consumer) => (
                          <Option key={consumer.id} value={consumer.id}>
                            {consumer.name}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>

                  <Form.Item
                    label={<Text text="Owner" />}
                    name="owner"
                    className={!enableEdit ? 'read-only-input' : ''}>
                    {!enableEdit ? (
                      <Typography.Text disabled={!selectedOwner} style={{ paddingLeft: '11px' }}>
                        {selectedOwner || <Text text="Owner is not provided" />}
                      </Typography.Text>
                    ) : (
                      <Select
                        disabled={!editingAllowed}
                        onChange={this.onOwnerSelection}
                        value={this.state.file.owner || ''}
                        placeholder={enableEdit ? i18n('Select a owner') : i18n('Owner is not provided')}>
                        {owners.map((owner) => (
                          <Option key={owner.id} value={owner.id}>
                            {owner.name}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>

                  <Form.Item noStyle shouldUpdate>
                    {() => (
                      <Form.Item name="constraints" label={<Text>File Constraints</Text>}>
                        {enableEdit ? (
                          <Select mode="multiple" placeholder={i18n('Please select constraints')}>
                            {this.props.constraints.map((el) => {
                              return (
                                <Option key={el.id} value={el.id}>
                                  {el.name}
                                </Option>
                              );
                            })}
                          </Select>
                        ) : (
                          <ConstraintsTags file list={this.getConstraints('file')} />
                        )}
                      </Form.Item>
                    )}
                  </Form.Item>

                  <Form.Item label="Fields Constraints" hidden={enableEdit}>
                    <ConstraintsTags list={this.getConstraints('field')} />
                  </Form.Item>

                  <Form.Item label={<Text>Description</Text>} name="description">
                    {enableEdit ? (
                      <MonacoEditor
                        lang="markdown"
                        value={description}
                        targetDomId="fileDescr"
                        onChange={this.onChange}
                      />
                    ) : (
                      <div className="read-only-markdown custom-scroll">
                        {this.state.file.description ? (
                          <ReactMarkdown source={this.state.file.description} />
                        ) : (
                          <Typography.Text type="secondary">
                            {<Text text="Description is not provided" />}
                          </Typography.Text>
                        )}
                      </div>
                    )}
                  </Form.Item>
                </Form>
                <OverwriteAssetModal
                  cancel={this.resetModal}
                  show={this.state.existingAsset.showModal}
                  acceptExisting={this.acceptExistingSettings}
                  acceptIncoming={this.acceptIncomingSettings}
                  existingName={this.state.existingAsset?.dbAsset?.name}
                  incomingName={this.state.existingAsset?.selectedAsset?.name}
                />
              </Spin>
              {/* SUPERFILE METADATA BLOCK */}
              {!superFileData ? null : <SuperFileMeta superFileData={superFileData} />}
            </TabPane>
            <TabPane tab={<Text text="Layout" />} key="3">
              <ComplianceInfo tags={complianceTags} />
              <LayoutTable dataSource={layout} setData={this.setLayoutData} enableEdit={enableEdit} />
            </TabPane>
            <TabPane tab={<Text text="Permissable Purpose" />} key="4">
              <Table
                size="small"
                pagination={false}
                scroll={{ y: '400px' }}
                columns={licenseColumns}
                rowKey={(record) => record.id}
                dataSource={this.props.availableLicenses}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: this.state.file.licenses,
                  onChange: (selectedRowKeys) =>
                    this.setState({ file: { ...this.state.file, licenses: selectedRowKeys } }),
                  getCheckboxProps: () => ({ disabled: !editingAllowed || !enableEdit }),
                }}
              />
            </TabPane>
            <TabPane tab={<Text text="Validation Rules" />} key="5">
              <div className="ag-theme-balham" style={{ height: '415px', width: '100%' }}>
                <EditableTable
                  dataDefinitions={[]}
                  enableEdit={enableEdit}
                  dataSource={validations}
                  showDataDefinition={false}
                  columns={validationRuleColumns}
                  editingAllowed={editingAllowed}
                  setData={this.setValidationData}
                  ref={(node) => (this.validationTable = node)}
                />
              </div>
            </TabPane>
            {VIEW_DATA_PERMISSION && showFilePreview ? (
              <TabPane tab={<Text text="File Preview" />} key="6">
                <Table
                  size="small"
                  pagination={false}
                  scroll={{ y: '400px' }}
                  columns={this.state.fileColumns}
                  rowKey={(record) => record.id}
                  dataSource={this.parseFileData()}
                />
              </TabPane>
            ) : null}

            {!this.props.isNew ? (
              <TabPane tab={<Text text="Workflows" />} key="7">
                <AssociatedDataflows assetId={this.state.file.id} assetType={'File'} />
              </TabPane>
            ) : null}
          </Tabs>
        </div>
        {this.props.displayingInModal ? controls : null}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, _ownProps) {
  let { newAsset = {}, clusterId } = state.assetReducer;
  const { user } = state.authenticationReducer;
  const { application, clusters, consumers, licenses, constraints } = state.applicationReducer;
  const { isNew = false, groupId = '' } = newAsset;

  return {
    user,
    application,
    isNew,
    groupId,
    clusterId,
    clusters,
    consumers,
    constraints,
    availableLicenses: licenses,
  };
}

let FileDetailsForm = connect(mapStateToProps)(FileDetails);
export default FileDetailsForm;
