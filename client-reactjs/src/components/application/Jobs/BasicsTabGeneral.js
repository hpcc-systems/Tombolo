import React, { useState, useCallback  } from 'react';
import { Form, Input, Checkbox, Button, Select, AutoComplete, Spin, message, Row, Col, Space, Tooltip, Typography } from 'antd/lib';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import ReactMarkdown from 'react-markdown';
import { useSelector, useDispatch } from 'react-redux';
import { assetsActions } from '../../../redux/actions/Assets';

import { MarkdownEditor } from '../../common/MarkdownEditor.js';
import { formItemLayout, multiLineFormItemLayout } from '../../common/CommonUtil.js';
import GitHubForm from './GitHubForm/GitHubForm.js';
import GHTable from './GitHubForm/GHTable.js';
import debounce from 'lodash/debounce';

const { Option } = Select;
const { TextArea } = Input;
const notificationOptions = [
  { label: 'Never', value: 'Never' },
  { label: 'Only on success', value: 'Only on success' },
  { label: 'Only on failure', value: 'Only on failure' },
  { label: 'Always', value: 'Always' },
];

function BasicsTabGeneral({ enableEdit, editingAllowed, addingNewAsset, jobType, clearState, onChange, clusters, localState, formRef, applicationId, setJobDetails }) {
  const assetReducer = useSelector((state) => state.assetReducer);

  const [search, setSearch] = useState({ loading:false, error:'', data:[] });
  const [job, setJob] = useState({loading: false, disableFields:false });

  const [notificationSettingsVisibility, changeNotificationSettingsVisibility] = useState(false);

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
      if (!response.ok) handleError(response);
      const suggestions = await response.json();
      setSearch(prev => ({prev, loading:false, data : suggestions }))

    } catch (error) {
      message.error('There was an error searching the job from cluster');
      setSearch(prev => ({prev, loading:false, error:error.message }))
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

  const onClusterSelection = (value) => {
    dispatch(assetsActions.clusterSelected(value));
  };

  const resetSearch = () =>{
    formRef.current.resetFields(['querySearchValue','name','title','entryBWR','ecl', 'gitRepo','description']);
    setSearch(prev => ({...prev, data:[]}));
    setJob((prev)=>({ ...prev, disableFields:false }))
  }

  const filesStoredOnGithub = formRef.current?.getFieldValue('isStoredOnGithub');
  const notifyJobExecutionStatus = formRef.current?.getFieldValue('notify');
  const hideOnReadOnlyView = !enableEdit || !addingNewAsset;

  return (
    <React.Fragment>
     <Spin spinning={job.loading} tip="loading job details"> 
      <Form.Item hidden={hideOnReadOnlyView} {...formItemLayout} label="Cluster" name="clusters">
        <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={onClusterSelection} style={{ width: '70%' }}>
          {clusters.map((cluster) => (
            <Option key={cluster.id}>{cluster.name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        hidden={hideOnReadOnlyView}
        valuePropName="checked"
        name="isStoredOnGithub"
        labelCol={{ xxl: { span: 2 } }}
        label={!enableEdit ? 'Files from GitHub' : 'Pull files from GitHub'}
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

      {enableEdit ? (
        <Form.Item label="Notify" name="notify">
          <Select style={{ width: '70%' }}>
            {notificationOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      ) : (
        <Form.Item label="Notify">
          <Space>
            <Form.Item name="notify" >
              <Input disabled className="read-only-input" style={{ width: '70%', paddingLeft: '8px' }} />
            </Form.Item>
            <Tooltip title="Useful information">
              <Typography.Link
                onClick={() => {
                  changeNotificationSettingsVisibility(!notificationSettingsVisibility);
                }}
              >
                {notificationSettingsVisibility ? 'Hide Settings' : 'Show settings'}
              </Typography.Link>
            </Tooltip>
          </Space>
        </Form.Item>
      )}

      {enableEdit || notificationSettingsVisibility ? (
        <Col offset={2} style={{ marginBottom: '10px', paddingLeft: '8px' }}>
          {notifyJobExecutionStatus === 'Always' || notifyJobExecutionStatus === 'Only on success' ? (
            <Form.Item
              label="Success Message "
              name="notificationSuccessMessage"
              {...multiLineFormItemLayout}
              className="MultiLineFormItem"
              validateTrigger="onBlur"
              rules={[{ required: (notifyJobExecutionStatus === 'Always' || notifyJobExecutionStatus === 'Only on success') && enableEdit, message: 'Success Message Required' }]}
            >
              <TextArea placeholder="success message" className={!enableEdit && 'read-only-input'} autoSize={{ minRows: 2 }} />
            </Form.Item>
          ) : null}

          {notifyJobExecutionStatus === 'Always' || notifyJobExecutionStatus === 'Only on failure' ? (
            <Form.Item
              label="Failure Message "
              name="notificationFailureMessage"
              {...multiLineFormItemLayout}
              className="MultiLineFormItem"
              validateTrigger="onBlur"
              rules={[{ required: (notifyJobExecutionStatus === 'Always' || notifyJobExecutionStatus === 'Only on failure') && enableEdit, message: 'Failure Message Required' }]}
            >
              <TextArea placeholder="Failure message" className={!enableEdit && 'read-only-input'} autoSize={{ minRows: 2 }} />
            </Form.Item>
          ) : null}

          {notifyJobExecutionStatus !== 'Never' ? (
            <Form.Item
              label="Recipients"
              name="notificationRecipients"
              {...multiLineFormItemLayout}
              className="MultiLineFormItem"
              validateTrigger="onBlur"
              rules={[
                { required: notifyJobExecutionStatus !== 'Never' && enableEdit, message: 'Recipient(s) E-mail required' },
                {
                  required: notifyJobExecutionStatus !== 'Never' && enableEdit,
                  message: 'Recipient(s) E-mail required',
                },
                () => ({
                  validator(_, value) {
                    const emails = value.split(',');
                    //Basic email validation
                    const invalidEmails = emails.filter((email) => !/^\S+@\S+\.\S+$/.test(email.trim()));
                    if (invalidEmails.length < 1) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(`${invalidEmails.length} invalid E-mail(s), Note : Do not enter ',' after the last email address`));
                  },
                }),
              ]}
            >
              <TextArea placeholder="Multiple E-mails, separate with comas (,)" className={!enableEdit && 'read-only-input'} autoSize={{ minRows: 2 }} />
            </Form.Item>
          ) : null}
        </Col>
      ) : null}

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
            rules={[{ pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/), message: 'Please enter a valid BWR' }]}
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
