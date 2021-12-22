import React from 'react';
import { Table, Tag, Popconfirm, Typography } from 'antd';

const GHTable = ({ form, enableEdit }) => {
  const reposList = form.current?.getFieldValue(['gitHubFiles', 'reposList']);
  const selectedRepoId = form.current?.getFieldValue(['gitHubFiles', 'selectedRepoId']);
  const selectedFile = form.current?.getFieldValue(['gitHubFiles', 'selectedFile']);
  const pathToFile = form.current?.getFieldValue(['gitHubFiles', 'pathToFile']);


  if (!reposList) return null;

  const remove = (tableRecord) => {    
    if (tableRecord.repoId === selectedRepoId){
      const resetFields= ['selectedFile','pathToFile','selectedRepoId'];
      form.current.resetFields(resetFields.map((field) => (['gitHubFiles', field])));
      form.current.resetFields(['name','title']);
    }
    
    const newReposList = reposList.filter((repo ) => repo.repoId !== tableRecord.repoId);
    console.log('-----newReposList-------------------------------------');
    console.dir({tableRecord, newReposList,  }, { depth: null });
    console.log('------------------------------------------');
    
    form.current.setFieldsValue({ gitHubFiles: { reposList: newReposList  } });
  };

  let columns = [
    {
      title: 'Github Repos',
      dataIndex: 'providedGithubRepo',
      key: 'providedGithubRepo',
      render: (text) => <Typography.Link copyable={{ text: text.trim() }}> {text} </Typography.Link>,
    },
    {
      title: 'Branch / Tag',
      dataIndex: 'selectedGitBranch',
      key: 'selectedGitBranch',
      render: (_, record) => {
        let render = { color: '', text: '' };
        if (record.selectedGitBranch) render = { color: 'cyan', text: record.selectedGitBranch.toUpperCase() };
        if (record.selectedGitTag) render = { color: 'magenta', text: record.selectedGitTag.toUpperCase() };
        return <Tag color={render.color}>{render.text}</Tag>;
      },
    },
    {
      title: 'Main File',
      key: 'pathToFile',
      dataIndex: 'pathToFile',
      render: (_,record) => {
        if (selectedRepoId && selectedFile){
          if ( record.repoId === selectedRepoId) {
            return <Tag color='geekblue'> {pathToFile?.join('/')} </Tag> 
          }else{
            return ''
          }
        }
      } 
    },
  ];

  const actionColumn = {
    title: 'Actions',
    key: 'actions',
    render: (text, record) => (
      <Popconfirm
        placement='right'
        title={'Are you sure you want to delete setting?'}
        onConfirm={() => {
          remove(record);
        }}
        okText='Yes'
        cancelText='No'
      >
        <Typography.Text style={{ cursor: 'pointer' }} type='danger'>
          Remove
        </Typography.Text>
      </Popconfirm>
    ),
  };

  if (enableEdit) columns = [...columns, actionColumn];

  return (
    <Table
      size='small'
      columns={columns}
      dataSource={reposList}
      style={{ margin: '10px 0' }}
      rowKey={(row)=> row.repoId}
      bordered={enableEdit ? false : true}
      showHeader={true}
      pagination={{ position: ['none', 'none'] }}
    />
  );
};

export default GHTable;
