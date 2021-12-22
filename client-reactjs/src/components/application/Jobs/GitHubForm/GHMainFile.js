import React, { useState, useEffect } from 'react';
import { Select, Cascader, Input } from 'antd';
import Form from 'antd/lib/form/Form';

function GHMainFile({ enableEdit, form, getAuthorizationHeaders }) {
  const [repoTree, setRepoTree] = useState([]);
  const [defaultCascader, setDefaultCascader] = useState(null);

  const fetchFilesFromGitHub = async (targetOption) => {
    const url = `https://api.github.com/repos/${targetOption.owner}/${targetOption.repo}/contents${ targetOption.path ? '/' + targetOption.path : '' }?ref=${targetOption.ref}`;
    const respond = await fetch(url, { headers: getAuthorizationHeaders() });
    const content = await respond.json();
    if (content.message) throw new Error(content.message);
    return content;
  };

  const onChange = (value, selectedOptions) => {
    if (value.length === 0)  form.current.resetFields([['gitHubFiles', 'selectedFile'], 'name', 'title']); // this is triggered when user resets cascader

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
      const content = await fetchFilesFromGitHub({
        path: null,
        ref: tagOrBranch,
        repo: selectedRepo.repo,
        owner: selectedRepo.owner,
      });
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

  useEffect(() => {
    const defaultCascader = form?.current.getFieldValue(['gitHubFiles', 'pathToFile']);
    if (defaultCascader) setDefaultCascader(defaultCascader);
  }, []);

  const repoList = form.current?.getFieldValue(['gitHubFiles', 'reposList']) || [];
  const selectedRepoId = form.current?.getFieldValue(['gitHubFiles', 'selectedRepoId']);

  return (
    <Form.Item label='Main File' required className={!enableEdit && 'read-only-input'}>
      <Input.Group compact>
        <Form.Item
          noStyle
          name={['gitHubFiles', 'selectedRepoId']}
          rules={[{ required: true, message: 'Please select main file repo' }]}
        >
          <Select
            allowClear
            style={{ width: '50%' }}
            onChange={handleSelectRepo}
            disabled={repoList.length === 0}
            placeholder='Select Main File Repo'
          >
            {repoList.map((repo) => (
              <Select.Option key={repo.repoId} value={repo.repoId}>
                {`${repo.providedGithubRepo.replace('https://github.com/', '')} - ${
                  repo.selectedGitTag || repo.selectedGitBranch
                }`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          name={['gitHubFiles', 'pathToFile']}
          rules={[{ required: true, message: 'Please select main file path' }]}
        >
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
  );
}

export default GHMainFile;
