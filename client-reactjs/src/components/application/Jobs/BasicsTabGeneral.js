import React, { useState, useCallback  } from 'react';
import { Form, Input, Checkbox, Button, Select, AutoComplete, Spin, message, Row, Col, Space,  Typography, Radio } from 'antd/lib';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import ReactMarkdown from 'react-markdown';
import { useSelector, useDispatch } from 'react-redux';
import { assetsActions } from '../../../redux/actions/Assets';

import { MarkdownEditor } from '../../common/MarkdownEditor.js';
import { formItemLayout , formItemLayoutWithOutLabel } from '../../common/CommonUtil.js';
import GitHubForm from './GitHubForm/GitHubForm.js';
import GHTable from './GitHubForm/GHTable.js';
import debounce from 'lodash/debounce';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

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

  const [showDetails, setShowDetails] = useState(false);

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

  const onClusterSelection = (value) => {
    dispatch(assetsActions.clusterSelected(value));
  };

  const resetSearch = () =>{
    formRef.current.resetFields(['querySearchValue','name','title','entryBWR','ecl', 'gitRepo','description']);
    setSearch(prev => ({...prev, data:[]}));
    setJob((prev)=>({ ...prev, disableFields:false }))
  }

  const filesStoredOnGithub = formRef.current?.getFieldValue('isStoredOnGithub');
  const notifyStatus = formRef.current?.getFieldValue('notify');
  const hideOnReadOnlyView = !enableEdit || !addingNewAsset;

  console.log('formRef.current?.getFieldValue("re")', formRef.current?.getFieldValue("notificationRecipients"));
  
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

          <Form.Item label="Notify" >
            <Space>
              <Form.Item name="notify">
                <Radio.Group className={enableEdit ? null : 'read-only-input'} >
                  {notificationOptions.map((option) => (
                    <Radio key={option.value} value={option.value}>{option.label}</Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
              {!enableEdit && (notifyStatus !== 'Never') && <Button onClick={()=>setShowDetails(prev=> !prev)}>Show Details</Button>}
            </Space>
          </Form.Item>

          
          {(notifyStatus === 'Always' || notifyStatus === 'Only on success') && (
            <Form.Item
              label="On Success"
              hidden={!enableEdit && !showDetails}
              name="notificationSuccessMessage"
              className={enableEdit ? null : 'read-only-input'}
              validateTrigger="onBlur"
              rules={[{ required: enableEdit, message: 'Success Message Required' }]}
            >
              <TextArea  allowClear={enableEdit}  placeholder="Success message"  autoSize={{ minRows: 1 }} className={!enableEdit && 'read-only-input'}  />
            </Form.Item>
          )}

          {(notifyStatus === 'Always' || notifyStatus === 'Only on failure') && (
            <Form.Item
              label="On Failure"
              hidden={!enableEdit && !showDetails}
              name="notificationFailureMessage"
              className={enableEdit ? null : 'read-only-input'}
              validateTrigger="onBlur"
              rules={[{ required: enableEdit, message: 'Failure Message Required' }]}
            >
              <TextArea allowClear={enableEdit} placeholder="Failure message" className={!enableEdit && 'read-only-input'}  autoSize={{ minRows: 1 }} />
            </Form.Item>
            )}

             
          {notifyStatus !== 'Never' && (
                <Form.List
                  name="notificationRecipients"
                  className={enableEdit ? null : 'read-only-input'}
               
                  rules={[
                    {
                      validator: async (_, names) => {
                        if (!names || names.length < 1) {
                          return Promise.reject(new Error('At least 1 Recipient'));
                        }
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => {
                    if ( !enableEdit && !showDetails) return null
                    return (
                      <>
                        {fields.map((field, index) => (
                          <Form.Item
                            {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                            label={index === 0 ? "Recipients" : ""}
                            required={enableEdit}
                            key={field.key}
                            className={enableEdit ? null : 'read-only-input'}
                            validateTrigger={['onChange', 'onBlur']}
                            rules={[
                              { 
                                type: 'email', 
                                required: true,
                                whitespace: true,
                                message: 'Please enter a valid email address'
                              },
                            ]}
                          >
                            <Row gutter={[8, 8]} style={{marginBottom:"8px"}}>
                              <Col span={12}>
                                <Form.Item
                                  {...field}
                                  noStyle
                                  validateTrigger={['onChange', 'onBlur']}
                                  rules={[
                                    { 
                                      type: 'email', 
                                      required: true,
                                      whitespace: true,
                                      message: 'Please enter a valid email address'
                                    },
                                  ]}
                                >
                                  <Input className={enableEdit ? null : 'read-only-input'} placeholder="recipient email" />
                                </Form.Item>
                              </Col>
                              {enableEdit ?
                                <Col span={3}>
                                  <MinusCircleOutlined
                                    className="dynamic-delete-button"
                                    onClick={() => remove(field.name)}
                                    />
                                </Col>
                              : null }
                            </Row>
                          </Form.Item>
                        ))}
                        {enableEdit ? 
                        <Form.Item {...formItemLayoutWithOutLabel} >
                          <Button style={{marginBottom:"8px"}} type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                            Add Recipient
                          </Button>
                          <Form.ErrorList errors={errors} />
                        </Form.Item>
                        : null}
                      </>
                    )
                  }
                  }
                </Form.List>
           )}


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
