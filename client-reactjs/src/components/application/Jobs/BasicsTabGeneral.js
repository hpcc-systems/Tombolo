import React, { useState } from 'react'
import { Form, Input, Checkbox, Button,  Select,  AutoComplete, Spin, message, Row, Col, Typography } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import ReactMarkdown from 'react-markdown';
import { useSelector, useDispatch } from "react-redux";
import { assetsActions } from '../../../redux/actions/Assets';
import { MarkdownEditor } from "../../common/MarkdownEditor.js";
import { formItemLayout } from "../../common/CommonUtil.js";

import GitHubForm from './GitHubForm/GitHubForm.js';
import GHTable from './GitHubForm/GHTable.js';

const { Option } = Select;  

function BasicsTabGeneral({enableEdit, editingAllowed, addingNewAsset, jobType, clearState, onChange, clusters, localState, formRef, applicationId, setJobDetails}) {
  const assetReducer = useSelector(state => state.assetReducer);
  const [jobSearchErrorShown, setJobSearchErrorShown] = useState(false);
  const [searchResultsLoaded, setSearchResultsLoaded] = useState(false);
  const [disableReadOnlyFields, setDisableReadOnlyFields] = useState(enableEdit);
  const [jobSearchSuggestions, setJobSearchSuggestions] = useState([]);  
  const [selectedCluster, setSelectedCluster] = useState(assetReducer.clusterId);
  const dispatch = useDispatch();  
  
  const searchJobs = (searchString) => {
    if(searchString.length <= 3 || jobSearchErrorShown) {
      return;
    }
    setJobSearchErrorShown(false);
    setSearchResultsLoaded(false);

    var data = JSON.stringify({clusterid: selectedCluster, keyword: searchString, indexSearch:true});
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
      setSearchResultsLoaded(true);
      setJobSearchSuggestions(suggestions);
    }).catch(error => {
      if(!jobSearchErrorShown) {
        error.json().then((body) => {
          message.config({top:130})
          message.error("There was an error searching the job from cluster");
        });
        setJobSearchErrorShown(true);      }
    });
  }

  const onJobSelected = (option) => {
    fetch("/api/hpcc/read/getJobInfo?jobWuid="+option.key+"&jobName="+option.value+"&clusterid="+selectedCluster+"&jobType="+jobType+"&applicationId="+applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(jobInfo => {      
      setDisableReadOnlyFields(true);
      localState.job = {
        ...localState.job,
        id: jobInfo.id,
        inputFiles: jobInfo.jobfiles.filter(jobFile => jobFile.file_type == 'input'),
        outputFiles: jobInfo.jobfiles.filter(jobFile => jobFile.file_type == 'output'),
        groupId: jobInfo.groupId,
        ecl: jobInfo.ecl

      }
      formRef.current.setFieldsValue({
        name: jobInfo.name,
        title: jobInfo.title,
        description: jobInfo.description,
        gitRepo: jobInfo.gitRepo,
        ecl: jobInfo.ecl,
        entryBWR: jobInfo.entryBWR
      })
      setJobDetails(jobInfo);
      return jobInfo;
    })
    .catch(error => {
      console.log(error);
    });
  }

  const onClusterSelection = (value) => {
    dispatch(assetsActions.clusterSelected(value));
    setSelectedCluster(value);
    localState.selectedCluster = value;
  }

const filesStoredOnGithub = formRef.current?.getFieldValue("isStoredOnGithub");
const hideOnReadOnlyView = !enableEdit || !addingNewAsset;

  return (
    <React.Fragment>
      <Form.Item hidden={hideOnReadOnlyView} {...formItemLayout} label="Cluster" name="clusters">
        <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={onClusterSelection} style={{ width: 190 }}>
            {clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
        </Select>
      </Form.Item>         
    
      <Form.Item hidden={hideOnReadOnlyView} valuePropName="checked" name='isStoredOnGithub' labelCol={{ xxl: {span: 2} }} label={ !enableEdit ? "Files from GitHub": "Pull files from GitHub"} > 
        <Checkbox className={!enableEdit && "read-only-input"} /> 
      </Form.Item>   

      <Form.Item hidden={hideOnReadOnlyView || filesStoredOnGithub || jobType === 'Spray' } label="Job" name="querySearchValue"  >
        <Row gutter={[8,0]}>
          <Col span={19} >
            <AutoComplete
              className="certain-category-search"
              dropdownClassName="certain-category-search-dropdown"
              dropdownMatchSelectWidth={false}
              dropdownStyle={{ width: 300 }}
              style={{ width: '100%' }}
              onSearch={(value) => searchJobs(value)}
              onSelect={(value, option) => onJobSelected(option)}
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
          <Col span={5}>
            <Button htmlType="button"  block  onClick={clearState}>
              Clear
            </Button>
          </Col>
        </Row>
      </Form.Item>

      {filesStoredOnGithub ? <GitHubForm enableEdit={enableEdit} form={formRef}/> : null }

      <Form.Item
        name="name" 
        label="Name" 
        validateTrigger= "onBlur"
        rules={[{ required: enableEdit ? true : false , message: 'Please enter the name', pattern: new RegExp(/^[a-zA-Z0-9: ._-]*$/) }]}
        className={enableEdit ? null : "read-only-input"} 
      >    
        <Input id="job_name" onChange={onChange} placeholder={enableEdit ? "Name" : 'Name is not provided'} disabled={!editingAllowed || disableReadOnlyFields} />
      </Form.Item>

      <Form.Item
        name="title" 
        label="Title" 
        validateTrigger= "onBlur"
        className={enableEdit? null : "read-only-input"}
        rules={[{ required: enableEdit ? true : false , message: 'Please enter a title!' }, { pattern: new RegExp(/^[ a-zA-Z0-9:._-]*$/), message: 'Please enter a valid Title. Title can have  a-zA-Z0-9:._- and space', }]}
      >
        <Input id="job_title" onChange={onChange} placeholder={enableEdit ? "Title" : 'Title is not provided'} disabled={!editingAllowed} />
      </Form.Item>
      
      {jobType !== 'Data Profile' && jobType !== 'Spray' ? 
        <Form.Item
          hidden={filesStoredOnGithub} 
          name="gitRepo" 
          label="Git Repo" 
          validateTrigger= "onBlur"
          rules={[{ type: 'url', message: 'Please enter a valid url', }]}
          className={enableEdit? null : "read-only-input"}
        >
          <Input id="job_gitRepo"
            onChange={onChange}
            placeholder={enableEdit ? "Git Repo" : 'Git Repo is not provided'}
            value={localState.gitRepo}
            disabled={!editingAllowed}
          /> 
        </Form.Item>
      : null }

      {jobType !== 'Spray' ? 
        <React.Fragment>
          <Form.Item 
            name="entryBWR"
            label="Entry BWR" 
            className={enableEdit? null : "read-only-input"}
            validateTrigger= "onBlur"
            rules={[{ pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/), message: 'Please enter a valid BWR', }]}
          >
            <Input id="job_entryBWR"
              onChange={onChange}
              placeholder={enableEdit ? "Entry BWR" : 'Entry BWR is not provided'}
              value={localState.entryBWR}
              disabled={!editingAllowed}
            /> 
          </Form.Item>

          <Form.Item 
            name="author"
            label="Author" 
            validateTrigger="onBlur"
            className={enableEdit? null : "read-only-input"}
            rules={[{ pattern: new RegExp(/^[a-zA-Z0-9: $._-]*$/), message: 'Please enter a valid author', }]}
          >
            <Input
              id="job_author"
              onChange={onChange}
              placeholder={enableEdit ? "Author" : 'Author is not provided'}
              value={localState.author}
              disabled={!editingAllowed}
            /> 
          </Form.Item>

          <Form.Item 
            name="contact"
            label="Contact Email" 
            validateTrigger= "onBlur"
            className={enableEdit? null : "read-only-input"}
            rules={[{ type: 'email', message: 'Please enter a valid email address', }]}
          >
            <Input 
              id="job_bkp_svc"
              onChange={onChange}
              placeholder={enableEdit ? "Contact" : 'Contact is not provided'}
              value={localState.contact}
              disabled={!editingAllowed}
            />
          </Form.Item>

          <Form.Item  name="description"  label="Description" >
            {enableEdit ?
              <MarkdownEditor
                name="description"
                id="job_desc"
                onChange={onChange}
                targetDomId="jobDescr"
                value={localState.description}
                disabled={!editingAllowed}
              />
              :
              <div className="read-only-markdown custom-scroll">
                {localState.job.description ?
                  <ReactMarkdown children={localState.job.description} />
                  : <Typography.Text type="secondary">Description is not provided</Typography.Text>} 
              </div>
            }
          </Form.Item>

          {/* {GitHub Repos Table will be shown in preview mode on the bottom of the form} */}
          {enableEdit ? null :
            <Form.Item shouldUpdate noStyle >
              {()=> <GHTable enableEdit={enableEdit} form={formRef} />}
            </Form.Item>
          }
        </React.Fragment>
        : null}                            
    </React.Fragment>                
  )
}

export default BasicsTabGeneral
