import React, { useState } from 'react';
import { Table, Input, Popconfirm, Form, Typography, Space, Button, message, Select } from 'antd';
import { useSelector } from 'react-redux';

import useGitHubProjectList from '../../../hooks/useGitHubProjectList';
import { authHeader, handleError } from '../../common/AuthHeader';
import Text from '../../common/Text';

const { Option, OptGroup } = Select;
const { Search } = Input;

const initialBranchAndTagList = {
  error: '',
  loading: false,
  fetched: false,
  data: { branches: [], tags: [] },
};

const GitHubSettings = () => {
  const [form] = Form.useForm();

  const [editingKey, setEditingKey] = useState('');
  const [branchAndTagList, setBranchAndTagList] = useState({ ...initialBranchAndTagList });

  const applicationId = useSelector((state) => state.applicationReducer?.application?.applicationId);

  const [projects, setProjects] = useGitHubProjectList();

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const cancel = (record) => {
    const { ghUserName, ghToken, ghLink } = record;
    if (!ghToken && !ghUserName && !ghLink) {
      return remove(record);
    } else {
      setEditingKey('');
    }
  };

  const remove = async (record) => {
    if (record.id) {
      try {
        const response = await fetch(`/api/gh_projects?application_id=${applicationId}&id=${record.id}`, {
          method: 'DELETE',
          headers: authHeader(),
        });
        if (!response.ok) handleError(response);
      } catch (error) {
        console.log('-error-----------------------------------------');
        console.dir({ error }, { depth: null });
        console.log('------------------------------------------');
        return message.error(error.message);
      }
    }
    setProjects((prev) => ({ ...prev, data: prev.data.filter((el) => el.key !== record.key) }));
    setEditingKey('');
  };

  const save = async (record) => {
    try {
      const row = await form.validateFields();

      if (!branchAndTagList.fetched) {
        return form.setFields([
          { name: 'ghBranchOrTag', errors: ['Re-select branch or cancel editing'] },
          { name: 'ghLink', errors: ['Check if credentials are valid'] },
        ]);
      }

      // REQUEST PASSED, CREDS ARE VALID OR NO CREDS NEEDED, CREATE DB RECORD AND SEND TO BACK;
      const payload = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ id: record.id, application_id: applicationId, ...row }),
      };

      const response = await fetch('/api/gh_projects', payload);
      if (!response.ok) handleError(response);

      // Update local list
      const data = await response.json();
      const newData = [...projects.data];
      const index = newData.findIndex((item) => record.key === item.key);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row, id: data.id });
        setProjects((prev) => ({ ...prev, loading: false, data: newData }));
        setEditingKey('');
      } else {
        newData.push({ key: newData.length + 1, id: data.id, ...row });
        setProjects((prev) => ({ ...prev, loading: false, data: newData }));
        setEditingKey('');
      }

      setBranchAndTagList({ ...initialBranchAndTagList });
      message.success('GitHub Project added successfully!');
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');

      if (error.errorFields) {
        form.setFields(...error.errorFields);
      } else {
        form.setFields([{ name: 'ghLink', errors: [error.message] }]);
        message.error(error.message);
      }
    }
  };

  const onSearch = async () => {
    try {
      const fieldsValue = form.getFieldsValue();

      //Check if credentials are valid by sending request to github
      // PARSING VARIABLES FOR REQUEST
      const url = fieldsValue.ghLink.split('/');
      const owner = url[3];
      const repo = url[4];

      if (!owner || !repo || !fieldsValue.ghLink.startsWith('https://github.com/'))
        throw new Error('Invalid repo provided.');

      setBranchAndTagList((prev) => ({ ...prev, loading: true, error: '' }));

      const options = {
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      };

      if (fieldsValue.ghToken) options.headers.Authorization = `token ${fieldsValue.ghToken}`;

      const response = await Promise.all(
        ['branches', 'tags'].map((el) => fetch(`https://api.github.com/repos/${owner}/${repo}/${el}`, options))
      );

      const [branches, tags] = await Promise.all(response.map((promise) => promise.json()));
      const errorMessage = branches.message || tags.message;
      if (errorMessage) throw new Error(errorMessage);

      setBranchAndTagList((prev) => ({ ...prev, loading: false, fetched: true, data: { branches, tags } }));
    } catch (error) {
      const message =
        error.message === 'Not Found' ? error.message + ' ( check your credentials and try again)' : error.message;
      const errorField = message === 'Bad credentials' ? 'ghToken' : 'ghLink';
      setBranchAndTagList((prev) => ({ ...prev, loading: false, error: message }));
      form.setFields([{ name: errorField, errors: [message] }]);
      message.error(message);
    }
  };

  const handleAddProject = () => {
    const blancProject = {
      key: projects.data.length + 1,
      ghProject: '',
      ghUserName: '',
      ghToken: '',
      ghLink: '',
      ghBranchOrTag: '',
    };
    setProjects((prev) => ({ ...prev, data: [...prev.data, blancProject] }));
    edit(blancProject);
  };

  const columns = [
    {
      title: <Text text="Project Name" />,
      dataIndex: 'ghProject',
      editable: true,
    },
    {
      title: <Text text="Username" />,
      dataIndex: 'ghUserName',
      editable: true,
    },
    {
      title: <Text text="Access token" />,
      dataIndex: 'ghToken',
      editable: true,
    },
    {
      title: <Text text="GitHub link" />,
      dataIndex: 'ghLink',
      editable: true,
    },
    {
      title: <Text text="Branch or Tag" />,
      dataIndex: 'ghBranchOrTag',
      editable: true,
    },
    {
      title: <Text text="Action" />,
      dataIndex: 'actions',
      width: '25%',
      render: (_, record) => {
        const editable = isEditing(record);

        return editable ? (
          <Space>
            <Button type="link" size="small" onClick={() => save(record)}>
              {<Text text="Save" />}
            </Button>

            <Typography.Link onClick={() => cancel(record)}> {<Text text="Cancel" />}</Typography.Link>

            <Popconfirm title="Are you sure you want to remove record?" onConfirm={() => remove(record)}>
              <Button danger type="text">
                {<Text text="Delete" />}
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
            Edit
          </Typography.Link>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) return col; // keeps actions buttons in place
    // PASS PROPS TO EditableCell HERE!
    return {
      ...col,
      onCell: (record) => ({
        record,
        onSearch,
        branchAndTagList,
        title: col.title,
        dataIndex: col.dataIndex,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <Form form={form} component={false} autoComplete={false}>
      <Button onClick={handleAddProject} type="primary" style={{ margin: '5px', display: 'block', marginLeft: 'auto' }}>
        {<Text text="Add new project" />}
      </Button>
      <Table
        bordered
        components={{ body: { cell: EditableCell } }}
        columns={mergedColumns}
        loading={projects.loading}
        dataSource={projects.data}
      />
    </Form>
  );
};

export default GitHubSettings;

// CELL FORM FIELD!
const EditableCell = ({
  _record,
  dataIndex,
  _title,
  editing,
  _index,
  children,
  branchAndTagList,
  onSearch,
  ...restProps
}) => {
  const rulesList = {
    ghProject: [{ required: true, whitespace: true, message: 'Name is required' }],
    ghLink: [{ required: true, whitespace: true, type: 'url', message: 'Invalid URL' }],
    ghBranchOrTag: [{ required: true, whitespace: true, message: 'Branch or Tag is required' }],
  };

  const rules = rulesList[dataIndex] || [];

  const getInputField = (dataIndex) => {
    const options = {
      default: <Input autoComplete="new-password" />,
      ghToken: <Input.Password autoComplete="new-password" />,
      ghLink: (
        <Search
          onSearch={onSearch}
          loading={branchAndTagList.loading}
          enterButton={editing ? true : false}
          placeholder={<Text text="Provide a link to GitHub repo" />}
        />
      ),
      ghBranchOrTag: (
        <Select
          style={{ maxWidth: '150px' }}
          dropdownStyle={{ minWidth: '300px' }}
          disabled={!branchAndTagList.fetched}
          defaultOpen={branchAndTagList.fetched}>
          {!branchAndTagList.fetched ? null : (
            <>
              <OptGroup label="Branches">
                {branchAndTagList.data.branches.map((el) => {
                  return (
                    <Option key={el.name} value={el.name}>
                      {el.name}
                    </Option>
                  );
                })}
              </OptGroup>
              <OptGroup label="Tags">
                {branchAndTagList.data.tags.map((el) => {
                  return (
                    <Option key={el.name} value={el.name}>
                      {el.name}
                    </Option>
                  );
                })}
              </OptGroup>
            </>
          )}
        </Select>
      ),
    };

    return options[dataIndex] || options['default'];
  };

  const readValue = dataIndex === 'ghToken' ? (children[1]?.length ? '*'.repeat(5) : '') : children;

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item name={dataIndex} validateTrigger={['onBlur']} rules={rules}>
          {getInputField(dataIndex)}
        </Form.Item>
      ) : (
        readValue
      )}
    </td>
  );
};
