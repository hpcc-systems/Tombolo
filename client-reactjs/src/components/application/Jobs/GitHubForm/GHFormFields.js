import React, { useState, useEffect } from 'react';
import { Select, Cascader, Row, Col, Button, Typography, Input } from 'antd';
import Search from 'antd/lib/input/Search';
import Form from 'antd/lib/form/Form';
import {v4 as uuidv4} from 'uuid';
import GHTable from './GHTable';

const initialRequestState = {
  error: null,
  loading: false,
  validateStatus: null,

  branches: null,
  selectedBranch: null,

  tags: null,
  selectedTag: null,

  owner: null,
  repo: null,
};

const GHFormFields = ({ form, enableEdit }) => {
  const [gitHubRequest, setGitHubRequest] = useState(initialRequestState);

  const [repoTree, setRepoTree] = useState([]);

  const [defaultCascader, setDefaultCascader] = useState(null);

  const pathToCurrentIndex = ['gitHubFiles', 'currentSettings'];

  const getAuthorizationHeaders = () => {
    const gitHubUserAccessToken = form?.current.getFieldValue(['gitHubFiles', 'gitHubUserAccessToken']);
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (gitHubUserAccessToken) headers.Authorization = `token ${gitHubUserAccessToken}`;
    return headers;
  };

  const onSearch = async (value, event) => {
    const url = value.split('/');
    const owner = url[3];
    const repo = url[4];
    try {
      if (!owner || !repo || !value.startsWith('https://github.com/')) throw new Error('Invalid repo provided.');
      setGitHubRequest((prev) => ({ ...prev, loading: true }));
      const response = await Promise.all( ['branches', 'tags'].map((el) => fetch(`https://api.github.com/repos/${owner}/${repo}/${el}`, { headers: getAuthorizationHeaders() }) ) );
      const [branches, tags] = await Promise.all(response.map((promise) => promise.json()));
      const errorMessage = branches.message || tags.message;
      if (errorMessage) throw new Error(errorMessage);
      setGitHubRequest(() => ({ repo, owner, tags, branches, error: null, loading: false, selectedTag: null, selectedBranch: null, validateStatus: 'success', }));
    } catch (error) {
      console.log(`error`, error);
      setGitHubRequest(() => ({ ...initialRequestState, error: error.message, validateStatus: 'error' }));
    }
    const resetFields = ['selectedGitBranch', 'selectedGitTag'];
    form.current.resetFields(resetFields.map((field) => [...pathToCurrentIndex, field]));
  };

  const handleBranchSelect = (value) => {
    const selectedBranch = gitHubRequest.branches.find((branch) => branch.name === value);
    setGitHubRequest((prev) => ({ ...prev, selectedBranch, selectedTag: null }));
    form.current.resetFields([[...pathToCurrentIndex, 'selectedGitTag']]);
  };

  const handleTagSelect = (value) => {
    const selectedTag = gitHubRequest.tags.find((tags) => tags.name === value);
    setGitHubRequest((prev) => ({ ...prev, selectedTag, selectedBranch: null }));
    form.current.resetFields([[...pathToCurrentIndex, 'selectedGitBranch']]);
  };

  const fetchFilesFromGitHub = async (targetOption) => {
    const url = `https://api.github.com/repos/${targetOption.owner}/${targetOption.repo}/contents${ targetOption.path ? '/' + targetOption.path : '' }?ref=${targetOption.ref}`;
    const respond = await fetch(url, { headers: getAuthorizationHeaders() });
    const content = await respond.json();
    if (content.message) throw new Error(content.message);
    return content;
  };

  const onChange = (value, selectedOptions) => {
    if (value.length === 0) {
      form.current.resetFields([['gitHubFiles', 'selectedFile'], 'name', 'title']); // this is triggered when user resets cascader
    }

    if (selectedOptions[selectedOptions.length - 1]?.isLeaf) {
      const updateFields = {
        gitHubFiles: { selectedFile: { ...selectedOptions[selectedOptions.length - 1] } },
        name: value[value.length - 1],
        title: value[value.length - 1],
      };
      form.current.setFieldsValue(updateFields);
    }
  };

  const loadBranchTree = async (selectedOptions) => {
    form.current.setFields([{ name: ['gitHubFiles', 'pathToFile'], errors: [] }]); // reset errors if loading new tree
    try {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      targetOption.loading = true;
      const content = await fetchFilesFromGitHub(targetOption);
      targetOption.loading = false;
      targetOption.children = content.map((el) => ({
        ...el,
        value: el.name,
        label: el.name,
        isLeaf: el.type === 'dir' ? false : true,
        ref: targetOption.ref,
        repo: targetOption.repo,
        owner: targetOption.owner,
        repoId: targetOption.repoId,
      }));
      setRepoTree([...repoTree]);
    } catch (error) {
      console.log(`error`, error);
      form.current.setFields([{ name: ['gitHubFiles', 'pathToFile'], errors: [error.message] }]);
    }
  };

  const handleSelectRepo = async (selectedRepoId) => {
    form.current.resetFields([['gitHubFiles', 'selectedFile'], ['gitHubFiles', 'pathToFile'], 'name', 'title']); // reset fields if repo is reselected

    if (selectedRepoId === undefined) return; // exit function if user hit reset button.

    const selectedRepo = form.current?.getFieldValue(['gitHubFiles', 'reposList']).find((el) => el.repoId === selectedRepoId);
    const tagOrBranch = selectedRepo.selectedGitTag || selectedRepo.selectedGitBranch;
    try {
      const content = await fetchFilesFromGitHub({ path: null, ref: tagOrBranch, repo: selectedRepo.repo, owner: selectedRepo.owner, });
      const initialTree = content.map((el) => ({
        ...el,
        value: el.name,
        label: el.name,
        isLeaf: el.type === 'dir' ? false : true,
        ref: tagOrBranch,
        repo: selectedRepo.repo,
        owner: selectedRepo.owner,
        repoId: selectedRepo.repoId,
      }));
      setRepoTree(initialTree);
    } catch (error) {
      form.current.setFields([{ name: ['gitHubFiles', 'selectedRepoId'], errors: [error.message] }]);
    }
  };

  const saveRepo = () => {
    const allRepos = form.current.getFieldValue(['gitHubFiles', 'reposList']) || [];
    const currentRepo = form.current.getFieldValue([...pathToCurrentIndex]);
    currentRepo.owner = gitHubRequest.owner;
    currentRepo.repo = gitHubRequest.repo;
    currentRepo.repoId = uuidv4(); // unique id needed in case of editing table of records with same github url
    const updatedFields = { gitHubFiles: { reposList: [...allRepos, currentRepo] } };
    form.current.setFieldsValue(updatedFields);
    const resetFields = Object.keys(currentRepo);
    form.current.resetFields(resetFields.map((field) => [...pathToCurrentIndex, field]));
    setGitHubRequest(() => ({ ...initialRequestState }));
  };

  useEffect(() => {
    const defaultCascader = form?.current.getFieldValue(['gitHubFiles', 'pathToFile']);

    if (defaultCascader) setDefaultCascader(defaultCascader);
    
  }, []);

  console.log('--getFieldValue----------------------------------------');
  console.dir({ss:form?.current.getFieldsValue(true)}, { depth: null });
  console.log('------------------------------------------');
  

  const disableSave = !gitHubRequest.selectedBranch && !gitHubRequest.selectedTag;
  const repoList = form.current?.getFieldValue(['gitHubFiles', 'reposList']) || [];
  const selectedRepoId = form.current?.getFieldValue(['gitHubFiles', 'selectedRepoId']);

  return (
    <>
      <Form.Item
        label='GitHub repo'
        className={!enableEdit && 'read-only-input'}
        name={[...pathToCurrentIndex, 'providedGithubRepo']}
        validateTrigger={['onBlur']}
        validateStatus={gitHubRequest.validateStatus}
        rules={[{ type: 'url', message: 'Invalid URL' }]}
        help={
          gitHubRequest.error ? (
            gitHubRequest.error
          ) : gitHubRequest.validateStatus === 'success' ? (
            <Typography.Text type='success'>Success! Choose the branch or tag.</Typography.Text>
          ) : null
        }
      >
        <Search
          onSearch={onSearch}
          loading={gitHubRequest.loading}
          enterButton={enableEdit ? true : false}
          placeholder='Provide a link to GitHub repo'
        />
      </Form.Item>

      <Form.Item label='Branch'>
        <Row gutter={[8, 8]}>
          <Col span={9}>
            <Form.Item noStyle name={[...pathToCurrentIndex, 'selectedGitBranch']} className={!enableEdit && 'read-only-input'} >
              <Select
                allowClear
                placeholder='Select branch'
                onChange={handleBranchSelect}
                disabled={enableEdit && !gitHubRequest.branches}
              >
                {gitHubRequest.branches?.map((branch) => (
                  <Select.Option key={branch.name} value={branch.name}>
                    {branch.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col style={{ display: 'flex', justifyContent: 'center' }} span={1}>
            or
          </Col>

          <Col span={9}>
            <Form.Item noStyle name={[...pathToCurrentIndex, 'selectedGitTag']} className={!enableEdit && 'read-only-input'} >
              <Select allowClear placeholder='Select Tag' disabled={enableEdit && !gitHubRequest.tags} onChange={handleTagSelect}>
                {gitHubRequest.tags?.map((tags) => (
                  <Select.Option key={tags.name} value={tags.name}>
                    {tags.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={5}>
          <Button disabled={disableSave} block  type='primary' onClick={saveRepo}>
              Add Repository
            </Button>
          </Col>
        </Row>
      </Form.Item>
                  
      <Form.Item hidden={repoList.length === 0} shouldUpdate wrapperCol={{ offset: 2, span: 11 }}>
        {() => <GHTable form={form} enableEdit={enableEdit} />}
      </Form.Item>

      <Form.Item label='Main File' required className={!enableEdit && 'read-only-input'}>
        <Input.Group compact>
          <Form.Item noStyle name={['gitHubFiles', 'selectedRepoId']} rules={[{ required: true, message: 'Please select main file repo' }]}>
            <Select
              allowClear
              style={{ width: '50%' }}
              onChange={handleSelectRepo}
              disabled={repoList.length === 0}
              placeholder='Select Main File Repo'
            >
              {repoList.map((repo) => (
                <Select.Option key={repo.repoId} value={repo.repoId}>
                  {`${repo.providedGithubRepo.replace('https://github.com/','')} - ${repo.selectedGitTag || repo.selectedGitBranch}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle name={['gitHubFiles', 'pathToFile']} rules={[{ required: true, message: 'Please select main file path' }]}>
            <Cascader
              style={{ width: '50%' }}
              changeOnSelect
              options={repoTree}
              onChange={onChange}
              loadData={loadBranchTree}
              placeholder='Select Main File'
              defaultValue={defaultCascader}
              className={!enableEdit && 'read-only-input'}
              disabled={selectedRepoId === undefined || repoTree.length === 0}
            />
          </Form.Item>
        </Input.Group>
      </Form.Item>
    </>
  );
};

export default GHFormFields;
