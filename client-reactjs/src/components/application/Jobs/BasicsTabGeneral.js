import React, { useState, useCallback  } from 'react';
import { Form, Input, Button, Select, AutoComplete, Spin, message, Row, Col, Typography, Radio, Alert } from 'antd/lib';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';

import { MarkdownEditor } from '../../common/MarkdownEditor.js';
import GitHubForm from './GitHubForm/GitHubForm.js';
import debounce from 'lodash/debounce';
import Notifications from './Notifications/index.js';
import OverwriteAssetModal from '../../common/OverWriteAssetModal.js';

// import GHTable from './GitHubForm/GHTable.js';
const { Option } = Select;

function BasicsTabGeneral({ enableEdit, editingAllowed, addingNewAsset, jobType, clearState, onChange, clusters, localState, formRef, applicationId, setJobDetails, onClusterSelection }) {
  const assetReducer = useSelector((state) => state.assetReducer);

  const clusterId = assetReducer.clusterId || formRef.current?.getFieldValue("clusters");

  const [search, setSearch] = useState({ loading:false, error:'', data:[] });
  const [job, setJob] = useState({ loading: false, disableFields: false, jobExists: false });
  const [existingAsset, setExistingAsset] = useState({ showModal: false, dbAsset : null, selectedAsset: {name:"", id:""} });
  
  const searchJobs = useCallback(debounce(async ({ searchString, clusterId }) => {
    message.config({maxCount: 1});
    if (searchString.length <= 3 ) return;      
    if (!clusterId) return message.info('Please select cluster before searching');

    try {
      setSearch(prev=>({...prev, loading:true, error:'' }));
      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ clusterid: clusterId, keyword: searchString.trim(), indexSearch: true })
      }; 
      
      const response = await fetch('/api/hpcc/read/jobsearch', options);
      
      if (!response.ok) {
        const error = new Error(response.statusText);
        error.status = response.status;
        throw error;
      }

      const suggestions = await response.json();
      setSearch(prev => ({prev, loading:false, data : suggestions }))

    } catch (error) {
      if (error.status === 422) {
        message.error('Some characters are not allowed in search, please check your input');
      } else{
        message.error('There was an error searching the job from cluster');
      }
      setSearch(prev => ({...prev, loading:false, error: error.message }))
    }
  }, 500)
  , []);
 
    const resetModal = () => {
      //this method is triggered when we click any of buttons on modal;
      setExistingAsset({ showModal: false, dbAsset: null, selectedAsset: { id: '', name: '' }});
    }

    const acceptExistingSettings = () => {
      const { dbAsset, selectedAsset } = existingAsset;
        // this method is triggered when we selected existing settings, we will overwrite most of the previous settings with the one that we have in db
      const updateFields = {
        jobSelected: true, // IF JOB SELECTED THEN ITS NO LONGER DESIGNER JOB!
        ecl: dbAsset.ecl,
        name: dbAsset.name,
        title: dbAsset.title,
        author: dbAsset.author,
        gitRepo: dbAsset.gitRepo,
        metaData: dbAsset.metaData,
        entryBWR: dbAsset.entryBWR,
        description: dbAsset.description,
        removeAssetId: selectedAsset.id, // We want to assign existing job to this design job, we will need to remove design job to avoid duplications
        notify: dbAsset.metaData?.notificationSettings?.notify,
        notificationRecipients: dbAsset.metaData?.notificationSettings?.recipients,
        notificationSuccessMessage: dbAsset.metaData?.notificationSettings?.successMessage,
        notificationFailureMessage: dbAsset.metaData?.notificationSettings?.failureMessage,
      };
  
      formRef.current.setFieldsValue(updateFields);
      setJobDetails(dbAsset); // will update state in FileDetails ||  JobDetails;
      resetModal();
    };
  
    const acceptIncomingSettings = () => {
      const { dbAsset, selectedAsset } = existingAsset;
      // this method is triggered when we selected incoming settings, we will just update missing values, no overwrites.
      const updateFields = {
        jobSelected: true, // IF JOB SELECTED THEN ITS NO LONGER DESIGNER JOB!
        ecl: dbAsset.ecl,
        name: dbAsset.name,
        entryBWR: dbAsset.entryBWR,
        removeAssetId: selectedAsset.id, // We want to assign existing job to this design job, we will need to remove design job to avoid duplications
      };
  
      formRef.current.setFieldsValue(updateFields);
      setJobDetails(dbAsset); // will update state in FileDetails ||  JobDetails;
      resetModal();
    };

  const onJobSelected = async (option) => {
    try {
      const url = `/api/hpcc/read/getJobInfo?jobWuid=${option.key}&jobName=${option.value}&clusterid=${clusterId}&jobType=${jobType}&applicationId=${applicationId}`;
      setJob(() => ({ loading: true, disableFields: false, jobExists: false }));
      const respond = await fetch(url, { headers: authHeader() });
      if (!respond.ok) handleError(respond);
      const jobInfo = await respond.json();
  
      const isExistingJob = jobInfo.id ? true : false;
      const selectedAssetId = formRef.current?.getFieldValue('selectedAssetId');
      const jobName = formRef.current?.getFieldValue('name');
      const title = formRef.current?.getFieldValue('title');
  
      let fieldsToUpdate = {
        jobSelected: true, // IF JOB SELECTED THEN ITS NO LONGER DESIGNER JOB
        ecl: jobInfo.ecl,
        name: jobInfo.name,
        entryBWR: jobInfo.entryBWR,
        title: title || jobInfo.name,
      };
  
      if (selectedAssetId) {
        // is selectedAssetId exist it means that JOB WAS CREATED BUT WITH NO ASSOCIATION, makes it a design job...
        setJob((prev) => ({ ...prev, loading: false })); // will update local loading indicator
        // HPCC JOB ALREADY EXISTS IN TOMBOLO, ASK USE TO OVERWRITE METADATA
        if (isExistingJob)
         return setExistingAsset({ showModal: true, dbAsset: jobInfo,  selectedAsset:{ name:jobName, id:selectedAssetId }});
        // HPCC JOB DOES NOT EXISTS IN TOMBOLO, associate this design job and Rename this job according to value found on HPCC;
        fieldsToUpdate.renameAssetId = jobName !== jobInfo.name ? selectedAssetId : '';
      }
      
      if (isExistingJob) {
        // Job existed in DB, add additional fields;
        // Adding additional fields when selecting existing job while creating job from scratch;
        fieldsToUpdate = {
          ...fieldsToUpdate,
          title: jobInfo.title,
          gitRepo: jobInfo.gitRepo,
          contact: jobInfo.contact,
          author: jobInfo.author,
          description: jobInfo.description,
          metaData: jobInfo.metaData,
          notify : jobInfo.metaData?.notificationSettings?.notify,
          notificationSuccessMessage : jobInfo.metaData?.notificationSettings?.successMessage,
          notificationFailureMessage : jobInfo.metaData?.notificationSettings?.failureMessage,
          notificationRecipients : jobInfo.metaData?.notificationSettings?.recipients
        };
      }
      // will update antD form values;
      formRef.current.setFieldsValue(fieldsToUpdate);
      setJobDetails(jobInfo); // will update state in JobDetails;
      setJob(() => ({ loading: false, disableFields: true, jobExists: isExistingJob })); // will update local loading indicator
    } catch (error) {
      console.log('onJobSelected', error);
      message.error('There was an error selecting a the job');
      setJob(() => ({ loading: false, disableFields: false, jobExists: false })); // will update local loading indicator
    }
  };

  const resetSearch = () =>{
    formRef.current.resetFields(['querySearchValue','name','entryBWR','ecl', 'gitRepo','jobSelected']);
    setSearch(prev => ({...prev, data:[]}));
    setJob((prev)=>({ ...prev, jobExists:false, disableFields:false }))
  }

  const filesStoredOnGithub = formRef.current?.getFieldValue('isStoredOnGithub');
  const isAssociated = formRef.current?.getFieldValue('isAssociated'); // this value is assign only at the time of saving job. if it is true - user can not change it.
  const clusterName = clusters?.find(cluster => cluster.id === formRef.current?.getFieldValue('clusters'))?.name;
  const jobName = formRef.current?.getFieldValue('name') || '';

  let hideOnReadOnlyView = !enableEdit || !addingNewAsset;

  if ( enableEdit && !isAssociated ) hideOnReadOnlyView = false;
  return (
    <React.Fragment>
     <Spin spinning={job.loading} tip="loading job details"> 
      <Form.Item label="Cluster" >
        <Row gutter={[8, 8]}>
          <Col span={12}>
            {enableEdit ? (
              <Form.Item noStyle name="clusters">
                <Select
                  allowClear
                  placeholder="Select a Cluster"
                  disabled={isAssociated}
                  onChange={onClusterSelection}
                >
                  {clusters.map((cluster) => (
                    <Option key={cluster.id}>{cluster.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            ) : (
              <Typography.Text disabled={!clusterName} style={{ paddingLeft: '11px' }}>
                {clusterName || 'Cluster is not provided'}
              </Typography.Text>
            )}
          </Col>
        </Row>
      </Form.Item>

      <Form.Item label="Source" name="isStoredOnGithub" hidden={!enableEdit || isAssociated}>
        <Radio.Group size="middle" buttonStyle="solid">
          <Radio.Button value={false}>HPCC</Radio.Button>
          <Radio.Button value={true}>GitHub</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item
       label="Job"
       name="querySearchValue"
       hidden={hideOnReadOnlyView || filesStoredOnGithub || jobType === 'Spray'}
       help={job.jobExists ? <Alert style={{border:"none",background:"transparent"}} message="Job already exists!" type="warning" showIcon /> : null}
       >
        <Row gutter={[8, 0]}>
          <Col span={19}>
            <AutoComplete
              className="certain-category-search"
              dropdownClassName="certain-category-search-dropdown"
              dropdownMatchSelectWidth={false}
              dropdownStyle={{ width: 300 }}
              style={{ width: '100%' }}
              onSearch={(value) => searchJobs({ searchString: value , clusterId: clusterId})}
              onSelect={(value, option) => onJobSelected(option)}
              placeholder="Search jobs"
              disabled={!editingAllowed}
              notFoundContent={search.loading ? <Spin />  : 'Not Found' }
            >
              {search.data.map((suggestion) => (
                <Option key={suggestion.value} value={suggestion.text}>
                  {suggestion.wuid}
                </Option>
              ))}
            </AutoComplete>
          </Col>
          <Col span={5}>
            <Button htmlType="button" block onClick={resetSearch}>
              Clear
            </Button>
          </Col>
        </Row>
      </Form.Item>

      {filesStoredOnGithub ? <GitHubForm enableEdit={enableEdit} form={formRef} /> : null}

      <Form.Item
        name="name"
        label="Name"
        validateTrigger="onBlur"
        rules={[
          {required: enableEdit ? true : false, message: 'Please enter the name'},
          { pattern: new RegExp(/^[a-zA-Z0-9: .@_-]*$/), message: 'Please enter a valid Title. Title can have  a-zA-Z0-9:._- and space' }
        ]}
        className={enableEdit ? null : 'read-only-input'}
        tooltip={enableEdit ? 'Should match job name in HPCC' : null}
      >
        {enableEdit ? (
          <Input
            id="job_name"
            onChange={onChange}
            placeholder={enableEdit ? 'Name' : 'Name is not provided'}
            disabled={!editingAllowed || !addingNewAsset || job.disableFields}
          />
        ) : (
          <Typography.Text style={{ paddingLeft: '11px' }}>{jobName}</Typography.Text>
        )}
      </Form.Item>

      <Form.Item
        name="title"
        label="Title"
        validateTrigger="onBlur"
        className={enableEdit ? null : 'read-only-input'}
        rules={[
          { required: enableEdit ? true : false, message: 'Please enter a title!' },
          { pattern: new RegExp(/^[ a-zA-Z0-9:@._-]*$/), message: 'Please enter a valid Title. Title can have  a-zA-Z0-9:._- and space' },
        ]}
      >
        <Input id="job_title" onChange={onChange} placeholder={enableEdit ? 'Title' : 'Title is not provided'} disabled={!editingAllowed} />
      </Form.Item>

      {jobType !== 'Data Profile' && jobType !== 'Spray' ? (
        <Form.Item
          hidden={filesStoredOnGithub}
          name="gitRepo"
          label="Git Repo"
          validateTrigger="onBlur"
          rules={[{ type: 'url', message: 'Please enter a valid url' }]}
          className={enableEdit ? null : 'read-only-input'}
        >
          <Input id="job_gitRepo" onChange={onChange} placeholder={enableEdit ? 'Git Repo' : 'Git Repo is not provided'} value={localState.gitRepo} disabled={!editingAllowed} />
        </Form.Item>
      ) : null}

      {jobType !== 'Spray' ? (
        <React.Fragment>
          <Form.Item
            name="entryBWR"
            label="Entry BWR"
            className={enableEdit ? null : 'read-only-input'}
            validateTrigger="onBlur"
            // rules={[{ pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/), message: 'Please enter a valid BWR' }]}
          >
            <Input
              id="job_entryBWR"
              onChange={onChange}
              placeholder={enableEdit ? 'Entry BWR' : 'Entry BWR is not provided'}
              value={localState.entryBWR}
              disabled={!editingAllowed}
            />
          </Form.Item>

          <Form.Item
            name="author"
            label="Author"
            validateTrigger="onBlur"
            className={enableEdit ? null : 'read-only-input'}
            rules={[{ pattern: new RegExp(/^[a-zA-Z0-9: $._-]*$/), message: 'Please enter a valid author' }]}
          >
            <Input id="job_author" onChange={onChange} placeholder={enableEdit ? 'Author' : 'Author is not provided'} value={localState.author} disabled={!editingAllowed} />
          </Form.Item>

          <Form.Item
            name="contact"
            label="Contact Email"
            validateTrigger="onBlur"
            className={enableEdit ? null : 'read-only-input'}
            rules={[{ type: 'email', message: 'Please enter a valid email address' }]}
          >
            <Input id="job_bkp_svc" onChange={onChange} placeholder={enableEdit ? 'Contact' : 'Contact is not provided'} value={localState.contact} disabled={!editingAllowed} />
          </Form.Item>

          <Notifications enableEdit={enableEdit} formRef={formRef} />
          
          <Form.Item name="description" label="Description">
            {enableEdit ? (
              <MarkdownEditor name="description" id="job_desc" onChange={onChange} targetDomId="jobDescr" value={localState.description} disabled={!editingAllowed} />
            ) : (
              <div className="read-only-markdown custom-scroll">
                {localState.job.description ? (
                  <ReactMarkdown children={localState.job.description} />
                ) : (
                  <Typography.Text type="secondary">Description is not provided</Typography.Text>
                )}
              </div>
            )}
          </Form.Item>
        </React.Fragment>
      ) : null}
        <OverwriteAssetModal
          cancel={resetModal}
          show={existingAsset.showModal}
          acceptExisting={acceptExistingSettings} 
          acceptIncoming={acceptIncomingSettings}
          existingName={existingAsset?.dbAsset?.name}
          incomingName={existingAsset?.selectedAsset?.name}
        />
      </Spin>
    </React.Fragment>
  );
}

export default BasicsTabGeneral;
