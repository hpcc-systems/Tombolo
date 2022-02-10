import React, { useState, useCallback  } from 'react';
import { Form, Input, Checkbox, Button, Select, AutoComplete, Spin, message, Row, Col, Typography } from 'antd/lib';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import ReactMarkdown from 'react-markdown';
import { useSelector, useDispatch } from 'react-redux';
import { assetsActions } from '../../../redux/actions/Assets';

import { MarkdownEditor } from '../../common/MarkdownEditor.js';
import GitHubForm from './GitHubForm/GitHubForm.js';
import GHTable from './GitHubForm/GHTable.js';
import debounce from 'lodash/debounce';
import Notifications from './Notifications/index.js';

const { Option } = Select;

function BasicsTabGeneral({ enableEdit, editingAllowed, addingNewAsset, jobType, clearState, onChange, clusters, localState, formRef, applicationId, setJobDetails, onClusterSelection }) {
  const assetReducer = useSelector((state) => state.assetReducer);

  const [search, setSearch] = useState({ loading:false, error:'', data:[] });
  const [job, setJob] = useState({loading: false, disableFields:false });

  const dispatch = useDispatch();

  const searchJobs = useCallback(debounce(async ({ searchString, clusterId }) => {
    message.config({maxCount: 1});
    if (searchString.length <= 3 ) return;      
    if (!clusterId) return message.info('Please select cluster before searching');

    try {
      setSearch(prev=>({...prev, loading:true, error:'' }));
      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ clusterid: clusterId, keyword: searchString, indexSearch: true })
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
 

  const onJobSelected =  async (option) => {
    try {
      const url = `/api/hpcc/read/getJobInfo?jobWuid=${option.key}&jobName=${option.value}&clusterid=${assetReducer.clusterId}&jobType=${jobType}&applicationId=${applicationId}`
      setJob(() => ({loading:true, disableFields: false }));
      const respond = await fetch(url, { headers: authHeader() });
      if (!respond.ok) handleError(respond)
      const jobInfo = await respond.json();
      
      formRef.current.setFieldsValue({ // will update antD form values;
        name: jobInfo.name,
        title: jobInfo.title,
        description: jobInfo.description,
        gitRepo: jobInfo.gitRepo,
        ecl: jobInfo.ecl,
        entryBWR: jobInfo.entryBWR,
      });

      setJobDetails(jobInfo);// will update state in JobDetails;
      
      setJob(() => ({loading:false, disableFields:true })); // will update local loading indicator
    } catch (error) {
      console.log('onJobSelected', error);
      message.error('There was an error selecting a the job');
      setJob(() => ({loading:false, disableFields:false })); // will update local loading indicator
    }
  };

  const resetSearch = () =>{
    formRef.current.resetFields(['querySearchValue','name','title','entryBWR','ecl', 'gitRepo','description']);
    setSearch(prev => ({...prev, data:[]}));
    setJob((prev)=>({ ...prev, disableFields:false }))
  }

  const filesStoredOnGithub = formRef.current?.getFieldValue('isStoredOnGithub');
  const hideOnReadOnlyView = !enableEdit || !addingNewAsset;
  
  return (
    <React.Fragment>
     <Spin spinning={job.loading} tip="loading job details"> 
      <Form.Item hidden={hideOnReadOnlyView} label="Cluster" name="clusters">
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={onClusterSelection}>
              {clusters.map((cluster) => (
                <Option key={cluster.id}>{cluster.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Form.Item>

      <Form.Item
        hidden={hideOnReadOnlyView}
        valuePropName="checked"
        name="isStoredOnGithub"
        label='Github Job'
      >
        <Checkbox className={!enableEdit && 'read-only-input'} />
      </Form.Item>

      <Form.Item hidden={hideOnReadOnlyView || filesStoredOnGithub || jobType === 'Spray'} label="Job" name="querySearchValue">
        <Row gutter={[8, 0]}>
          <Col span={19}>
            <AutoComplete
              className="certain-category-search"
              dropdownClassName="certain-category-search-dropdown"
              dropdownMatchSelectWidth={false}
              dropdownStyle={{ width: 300 }}
              style={{ width: '100%' }}
              onSearch={(value) => searchJobs({ searchString: value , clusterId: assetReducer.clusterId })}
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
        rules={[{ required: enableEdit ? true : false, message: 'Please enter the name', pattern: new RegExp(/^[a-zA-Z0-9: ._-]*$/) }]}
        className={enableEdit ? null : 'read-only-input'}
      >
        <Input id="job_name" onChange={onChange} placeholder={enableEdit ? 'Name' : 'Name is not provided'} disabled={!editingAllowed || job.disableFields} />
      </Form.Item>

      <Form.Item
        name="title"
        label="Title"
        validateTrigger="onBlur"
        className={enableEdit ? null : 'read-only-input'}
        rules={[
          { required: enableEdit ? true : false, message: 'Please enter a title!' },
          { pattern: new RegExp(/^[ a-zA-Z0-9:._-]*$/), message: 'Please enter a valid Title. Title can have  a-zA-Z0-9:._- and space' },
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

          {/* {GitHub Repos Table will be shown in preview mode on the bottom of the form} */}
          {enableEdit ? null : (
            <Form.Item shouldUpdate noStyle>
              {() => <GHTable enableEdit={enableEdit} form={formRef} />}
            </Form.Item>
          )}
        </React.Fragment>
      ) : null}
      </Spin>
    </React.Fragment>
  );
}

export default BasicsTabGeneral;
