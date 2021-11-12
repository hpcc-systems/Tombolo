import React,{useState} from 'react'
import { Button, Table } from 'antd/lib';
import { Constants } from '../../common/Constants';
// import { authHeader, handleError } from "../../common/AuthHeader.js";
// import ReactDOM from 'react-dom';
// import { useSelector } from "react-redux";

function JobExecutionDetails({workflowDetails}) {

  const createUniqueFiltersArr =(baseArr,column) =>{
  const columnsNames ={updatedAt:'updatedAt', name:"name",wuid: 'wuid', status:"status"}; 
  if(!baseArr || !column || !columnsNames[column]) return [];
  const dictionary = baseArr.reduce((acc,el)=> {
       let key = el[column] || 'empty';
      if (column === 'updatedAt'){
         key = new Date(el.updatedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
      }
      if (!acc[key]){
        acc[key] = true;
        acc.result.push({text: key, value: key })
      }
     return acc;
    },{result:[]});
    return dictionary.result;
  }

  const [filters, setFilters] = useState({});

  const jobColumns = [
    {
      title: 'Job',
      dataIndex: 'name',
      width: '20%',
      sorter: (a, b) => a.name.localeCompare(b.name),
      onFilter: (value, record) => record.name.includes(value),
      filters: createUniqueFiltersArr(workflowDetails.wuDetails,'name'),
      filteredValue: filters.name || null,
    },
    {
      title: 'Wuid',
      dataIndex: 'wuid',
      width: '15%',
      sorter: (a, b) => a.wuid.localeCompare(b.wuid),
      onFilter: (value, record) =>{
        if (value === 'empty' && !record.wuid ) return true;
        return  record.wuid.includes(value)
      },
      filters: createUniqueFiltersArr(workflowDetails.wuDetails,'wuid'),
      filteredValue: filters.wuid || null,
    },
    {
      title: 'Date',
      dataIndex: 'updatedAt',
      render: (text, record) => {
        let updatedAt = new Date(text);
        return updatedAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ updatedAt.toLocaleTimeString('en-US')
      },
      width: '25%',
      defaultSortOrder: 'ascend',
      sorter: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      onFilter: (value, record) =>{
        const updatedAt = new Date(record.updatedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
        return updatedAt.includes(value)},
      filters: createUniqueFiltersArr(workflowDetails.wuDetails,'updatedAt'),
      filteredValue: filters.updatedAt || null,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: '20%',
      sorter: (a, b) => a.status.localeCompare(b.status),
      onFilter: (value, record) => record.status.includes(value),
      filters: createUniqueFiltersArr(workflowDetails.wuDetails, 'status'),
      filteredValue: filters.status || null,
    },
    {
      title: 'Duration',
      dataIndex: 'wu_duration',
      width: '20%',
    },
  ]
  
  const handleTablechange =(pagination, filters, sorter)=>{
    const activeFilters = {};
    for(const key in filters) filters[key] && (activeFilters[key] = filters[key]);
    setFilters(()=> activeFilters);
  }

  const handleClearFilters =()=>{
    setFilters(()=>({}));
  }
  console.log(`filters`, filters)

  return (
    <React.Fragment>
      <Button type='primary' disabled={!Object.keys(filters).length}  size='small' onClick={handleClearFilters}>Clear all Filters</Button>
      <Table
        size="small"
        columns={jobColumns}
        onChange={handleTablechange}
        rowKey={record => record.id}
        dataSource={workflowDetails.wuDetails}
        pagination={{ pageSize: 10 }} 
        scroll={{ y: 190 }}
      />
    </React.Fragment>
    )
}

export default JobExecutionDetails;