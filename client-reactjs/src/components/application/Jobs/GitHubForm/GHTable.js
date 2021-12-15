import React  from "react";
import { Table, Tag, Popconfirm, Typography  } from 'antd';

const GHTable =({form, enableEdit}) =>{
    const reposList= form.current?.getFieldValue(["gitHubFiles", "reposList"]) ;
    if (!reposList) return null;
    
    const remove =(recordIndex) =>{
      const newReposList = reposList.filter((record,index)=> index !== recordIndex);
      form.current.setFieldsValue({ gitHubFiles: { reposList: newReposList }});
    }
  
    let columns = [
      {
        title: 'Github Repos',
        dataIndex: 'providedGithubRepo',
        key: 'providedGithubRepo',
        render: text => <Typography.Link copyable={{text:text.trim()}}> {text} </Typography.Link>
      },
      {
        title: 'Branch / Tag',
        dataIndex: 'selectedGitBranch',
        key: 'selectedGitBranch',
        render: (_,record) => {
            let render = {color: '', text: ''}
            if (record.selectedGitBranch) render= {color: "cyan", text: record.selectedGitBranch.toUpperCase()}; 
            if (record.selectedGitTag) render= {color: "magenta", text: record.selectedGitTag.toUpperCase()};
            return <Tag color={render.color}>{render.text}</Tag> 
        }
      },
      {
        title: 'Main File',
        key: 'pathToFile',
        dataIndex: 'pathToFile',
        render: path =>  <Tag color='geekblue'> {path.join('/')} </Tag> 
      },
    ];
  
    const actionColumn ={
      title: 'Actions',
      key: 'actions',
      render: (text, record,index) => (
        <Popconfirm placement="right" title={"Are you sure you want to delete setting?"} onConfirm={() => {remove(index);}} okText="Yes" cancelText="No">
            <Typography.Text style={{cursor:'pointer'}} type="danger">Remove</Typography.Text>
        </Popconfirm>
      ),
    };
  
    if (enableEdit) columns = [...columns, actionColumn]
  
    return (
      <Table
        size="small"
        columns={columns}
        dataSource={reposList}
        style={{margin:'10px 0'}}
        bordered={enableEdit ? false : true}
        showHeader={true}
        pagination={{ position: ['none','none'] }}
        /> 
    ) 
  }

export default GHTable;
