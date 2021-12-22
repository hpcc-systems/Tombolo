import React, { useState } from 'react';
import { Select, Row, Col, Button, Typography, Input } from 'antd';
import Form from 'antd/lib/form/Form';
import Search from 'antd/lib/input/Search';
import { v4 as uuidv4 } from 'uuid';

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

function GHSearchAndBranch({ form, enableEdit, getAuthorizationHeaders }) {
  const [gitHubRequest, setGitHubRequest] = useState(initialRequestState);
  const pathToCurrentIndex = ['gitHubFiles', 'currentSettings'];

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

  const disableSave = !gitHubRequest.selectedBranch && !gitHubRequest.selectedTag;

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
            <Form.Item noStyle name={[...pathToCurrentIndex, 'selectedGitBranch']} className={!enableEdit && 'read-only-input'}>
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
            <Form.Item noStyle name={[...pathToCurrentIndex, 'selectedGitTag']} className={!enableEdit && 'read-only-input'}>
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
            <Button disabled={disableSave} block type='primary' onClick={saveRepo}>
              Add Repository
            </Button>
          </Col>
        </Row>
      </Form.Item>
    </>
  );
}

export default GHSearchAndBranch;
