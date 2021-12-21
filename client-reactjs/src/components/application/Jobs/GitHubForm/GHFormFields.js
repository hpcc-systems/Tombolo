import React, { useState, useEffect } from 'react';
import { Select, Cascader, Row, Col, Button, Typography } from 'antd';
import Search from 'antd/lib/input/Search';
import Form from 'antd/lib/form/Form';
import { formItemLayout } from '../../../common/CommonUtil';

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
      const response = await Promise.all(
        ['branches', 'tags'].map((el) =>
          fetch(`https://api.github.com/repos/${owner}/${repo}/${el}`, { headers: getAuthorizationHeaders() })
        )
      );
      const [branches, tags] = await Promise.all(response.map((promise) => promise.json()));
      const errorMessage = branches.message || tags.message;
      if (errorMessage) throw new Error(errorMessage);
      setGitHubRequest(() => ({
        repo,
        owner,
        tags,
        branches,
        error: null,
        loading: false,
        selectedTag: null,
        selectedBranch: null,
        validateStatus: 'success',
      }));
    } catch (error) {
      console.log(`error`, error);
      setGitHubRequest(() => ({
        loading: false,
        selectedTag: null,
        selectedBranch: null,
        error: error.message,
        validateStatus: 'error',
      }));
    }
    const resetFields = ['selectedGitBranch', 'selectedGitTag', 'pathToFile', 'selectedFile'];

    form.current.resetFields(resetFields.map((field) => [...pathToCurrentIndex, field]));
  };

  const handleBranchSelect = (value) => {
    const selectedBranch = gitHubRequest.branches.find((branch) => branch.name === value);
    setGitHubRequest((prev) => ({ ...prev, selectedBranch, selectedTag: null }));
    const resetFields = ['selectedGitTag', 'selectedFile', 'pathToFile'];
    form.current.resetFields(resetFields.map((field) => [...pathToCurrentIndex, field]));
  };

  const handleTagSelect = (value) => {
    const selectedTag = gitHubRequest.tags.find((tags) => tags.name === value);
    setGitHubRequest((prev) => ({ ...prev, selectedTag, selectedBranch: null }));
    const resetFields = ['selectedGitBranch', 'selectedFile', 'pathToFile'];
    form.current.resetFields(resetFields.map((field) => [...pathToCurrentIndex, field]));
  };

  const onChange = (value, selectedOptions) => {
    // console.log(`value`, value); console.log(`selectedFile`, selectedOptions[selectedOptions.length - 1]); console.log("selectedRepo", selectedOptions[selectedOptions.length - 2]); // this object has children prop with all files currently in repo, can be stale info if saved to db
    if (value.length === 0) {
      form.current.setFieldsValue({ gitHubFiles: { selectedFile: null } }); // this is triggered when user resets cascader
    }
    if (selectedOptions[selectedOptions.length - 1]?.isLeaf) {
      form.current.setFieldsValue({
        gitHubFiles: {
          currentSettings: {
            selectedFile: {
              ...selectedOptions[selectedOptions.length - 1],
              projectOwner: gitHubRequest.owner,
              projectName: gitHubRequest.repo,
            },
          },
          name: value[value.length - 1],
          title: value[value.length - 1],
        },
      });
    }
  };

  const fetchFilesFromGit = async (targetOption) => {
    const url = `https://api.github.com/repos/${gitHubRequest.owner}/${gitHubRequest.repo}/contents${
      targetOption.path ? '/' + targetOption.path : ''
    }?ref=${targetOption.ref}`;
    const respond = await fetch(url, { headers: getAuthorizationHeaders() });
    const content = await respond.json();
    if (content.message) throw new Error(content.message);
    return content;
  };

  const loadBranchTree = async (selectedOptions) => {
    try {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      targetOption.loading = true;
      targetOption.ref = gitHubRequest.selectedTag?.name || gitHubRequest.selectedBranch?.name;
      const content = await fetchFilesFromGit(targetOption);
      targetOption.loading = false;
      targetOption.children = content.map((el) => ({
        ...el,
        value: el.name,
        label: el.name,
        isLeaf: el.type === 'dir' ? false : true,
      }));
      setRepoTree([...repoTree]);
    } catch (error) {
      console.log(`error`, error);
      form.current.setFields([{ name: [...pathToCurrentIndex, 'pathToFile'], errors: [error.message] }]);
    }
  };

  useEffect(() => {
    if (gitHubRequest.selectedBranch?.name || gitHubRequest.selectedTag?.name) {
      const filesFrom = gitHubRequest.selectedTag?.name || gitHubRequest.selectedBranch?.name;
      (async () => {
        try {
          const content = await fetchFilesFromGit({ path: null, ref: filesFrom });
          const initialTree = content.map((el) => ({
            ...el,
            value: el.name,
            label: el.name,
            isLeaf: el.type === 'dir' ? false : true,
          }));
          setRepoTree(initialTree);
        } catch (error) {
          form.current.setFields([{ name: [...pathToCurrentIndex, 'pathToFile'], errors: [error.message] }]);
        }
      })();
    }
  }, [gitHubRequest.selectedBranch, gitHubRequest.selectedTag]);

  useEffect(() => {
    const defaultCascader = form?.current.getFieldValue([...pathToCurrentIndex, 'pathToFile']);

    if (defaultCascader?.length > 1) {
      const createOptionsTree = (defaultCascader, currentNode = {}, repoTree = {}) => {
        const [currentValue, ...rest] = defaultCascader;

        const currentObject = { value: currentValue, label: currentValue, children: [] };

        if (!repoTree.children) {
          repoTree = currentObject;
          return createOptionsTree(rest, repoTree, repoTree);
        } else {
          currentNode.children.push(currentObject);
          if (defaultCascader.length === 1) {
            delete currentObject.children;
            return repoTree;
          }
          return createOptionsTree(rest, currentObject, repoTree);
        }
      };

      const defaultOptions = createOptionsTree(defaultCascader);
      setDefaultCascader(defaultCascader);
      setRepoTree([defaultOptions]);
    }
  }, []);

  const saveRepo = () => {
    const currentRepo = form.current.getFieldValue([...pathToCurrentIndex]);
    const allRepos = form.current.getFieldValue(['gitHubFiles', 'reposList']) || [];
    const updatedFields = { gitHubFiles: { reposList: [...allRepos, currentRepo] } };
    if (allRepos.length === 0) {
      // will update Job name and Title
      updatedFields.name = currentRepo.selectedFile.name;
      updatedFields.title = currentRepo.selectedFile.name;
    }
    form.current.setFieldsValue(updatedFields);
    const resetFields = Object.keys(currentRepo);
    form.current.resetFields(resetFields.map((field) => [...pathToCurrentIndex, field]));
    setGitHubRequest(() => ({ ...initialRequestState }));
    console.log('--GH----------------------------------------');
    console.dir({ gh: form.current.getFieldsValue(true) }, { depth: null });
    console.log('------------------------------------------');
  };

  const disableSave = !form.current.getFieldValue([...pathToCurrentIndex, 'pathToFile']);

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
            <Typography.Text type='success'>Success! Choose the branch or tags you want to browse</Typography.Text>
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
          <Col span={11}>
            <Form.Item
              name={[...pathToCurrentIndex, 'selectedGitBranch']}
              className={!enableEdit && 'read-only-input'}
              // validateTrigger={["onBlur"]}
              // rules={[ { required:   !form.current?.getFieldValue([...pathToCurrentIndex, "selectedGitTag"]), message: "Select branch", }, ]}
            >
              <Select
                allowClear
                placeholder='Select branch'
                disabled={enableEdit && !gitHubRequest.branches}
                onChange={handleBranchSelect}
              >
                {gitHubRequest.branches?.map((branch) => (
                  <Select.Option key={branch.name} value={branch.name}>
                    {branch.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col style={{ display: 'flex', justifyContent: 'center' }} span={2}>
            or
          </Col>

          <Col span={11}>
            <Form.Item
              name={[...pathToCurrentIndex, 'selectedGitTag']}
              className={!enableEdit && 'read-only-input'}
              // validateTrigger={["onBlur"]}
              // rules={[ { required:  !form.current?.getFieldValue([...pathToCurrentIndex, "selectedGitBranch"]), message: "Select Tag", }, ]}
            >
              <Select allowClear placeholder='Select Tag' disabled={enableEdit && !gitHubRequest.tags} onChange={handleTagSelect}>
                {gitHubRequest.tags?.map((tags) => (
                  <Select.Option key={tags.name} value={tags.name}>
                    {tags.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form.Item>

      <Form.Item
        label='Main File'
        name={[...pathToCurrentIndex, 'pathToFile']}
        // validateTrigger={["onBlur"]}
        // rules={[
        //   { required: true, message: "" },
        //   ({ getFieldValue }) => ({
        //     validator(field, value) {
        //       if (getFieldValue([...pathToCurrentIndex, "selectedFile"])) {
        //         return Promise.resolve();
        //       }
        //       return Promise.reject(new Error("Select a start file"));
        //     },
        //   }),
        // ]}
      >
        <Cascader
          changeOnSelect
          options={repoTree}
          onChange={onChange}
          loadData={loadBranchTree}
          defaultValue={defaultCascader}
          className={!enableEdit && 'read-only-input'}
          disabled={!gitHubRequest.selectedBranch && !gitHubRequest.selectedTag}
        />
      </Form.Item>
      <Form.Item hidden={true} name={[...pathToCurrentIndex, 'selectedFile']} />
      {enableEdit && (
        <Form.Item wrapperCol={{ offset: formItemLayout.labelCol.span, span: formItemLayout.wrapperCol.span }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button disabled={disableSave} shape='round' size='small' type='primary' onClick={saveRepo}>
              Save Repository
            </Button>
          </div>
        </Form.Item>
      )}
    </>
  );
};

export default GHFormFields;
