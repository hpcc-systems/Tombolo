import React, {useEffect, useState} from 'react'
import { Constants } from '../../common/Constants';
import { Button, Space, Table } from 'antd/lib';

function ManualJobsStatus({workflowDetails,  refreshData}) {

  const [manualJobs, setManualJobs] = useState([]);
  const [filters, setFilters] = useState({});
  
  const createUniqueFiltersArr =(baseArr,column) => {
    const columnsNames ={notifiedOn:'notifiedOn',notifiedTo: 'notifiedTo',respondedOn:'respondedOn', name:"name", status:"status"}; 
    if(!baseArr || !column || !columnsNames[column]) return [];
    const dictionary = baseArr.reduce((acc,el)=> {
         let key = el[column] || 'empty';
        if (column === 'notifiedOn' || column === 'respondedOn'){
          if (el[column]) {
            key = new Date(el[column]).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
          }else { 
            key = 'empty'
          }
        }
        if (!acc[key]){
          acc[key] = true;
          acc.result.push({text: key, value: key })
        }
       return acc;
      },{result:[]});
      return dictionary.result;
  }
  
    //Table columns
  const columns = [
      {
        title: 'Job Name',
        dataIndex: 'name',
        width: '20%',
        sorter: (a, b) => a.name.localeCompare(b.name),
        onFilter: (value, record) => record.name.includes(value),
        filters: createUniqueFiltersArr(manualJobs,'name'),
        filteredValue: filters.name || null,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: '20%',
        sorter: (a, b) => a.status.localeCompare(b.status),
        onFilter: (value, record) => record.status.includes(value),
        filters: createUniqueFiltersArr(manualJobs, 'status'),
        filteredValue: filters.status || null,
      },  
      {
        title: 'Notified To',
        dataIndex: 'notifiedTo',
        width: '20%',
        onFilter: (value, record) => record.notifiedTo.includes(value),
        filters: createUniqueFiltersArr(manualJobs, 'notifiedTo'),
        filteredValue: filters.notifiedTo || null,
      },
      {
        title: 'Notified On',
        dataIndex: 'notifiedOn',
        width: '20%',
        defaultSortOrder: 'ascend',
        render :  (text, record) => {
          let updatedAt = new Date(text);
          return updatedAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ updatedAt.toLocaleTimeString('en-US')
        },
        sorter: (a, b) => new Date(b.notifiedOn) - new Date(a.notifiedOn),
        onFilter: (value, record) =>{
          const notifiedOn = new Date(record.notifiedOn).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
          return notifiedOn.includes(value)},
        filters: createUniqueFiltersArr(manualJobs,'notifiedOn'),
        filteredValue: filters.notifiedOn || null,
      },
      {
        title: 'Responded On',
        dataIndex: 'respondedOn',
        width: '20%',
        render :  (text, record) => {
          let updatedAt = new Date(text);
          return text ? updatedAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ updatedAt.toLocaleTimeString('en-US') : ''
        },
        sorter: (a, b) => new Date(b.respondedOn) - new Date(a.respondedOn),
        onFilter: (value, record) =>{
          if (value === 'empty' && !record.respondedOn ) return true;
          const respondedOn = new Date(record.respondedOn).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
          return respondedOn.includes(value)},
        filters: createUniqueFiltersArr(manualJobs,'respondedOn'),
        filteredValue: filters.respondedOn || null,
      }
  ]

  //Table Data - filter jobs with type manual
  useEffect(() => {
    if(workflowDetails){
    const manualJobs = workflowDetails.wuDetails.reduce((acc,el) =>{
      if(el.jobType === 'Manual') {
        const record = {
          name: el.name,
          status:el.status,
          notifiedTo: el.manualJob_meta?.notifiedTo,
          notifiedOn: el.manualJob_meta?.notifiedOn,
          respondedOn: el.manualJob_meta?.respondedOn,
          result: el.manualJob_meta?.response
        }
        acc.push(record);
      }
      return acc;
    },[])

    setManualJobs(manualJobs)
    }
  }, [workflowDetails])
  
  const handleTablechange =(pagination, filters, sorter)=>{
    const activeFilters = {};
    for(const key in filters) filters[key] && (activeFilters[key] = filters[key]);
    setFilters(()=> activeFilters);
  }
  
  const handleClearFilters =()=>{
    setFilters(()=>({}));
  }
  // JSX
  return (
    <React.Fragment>
      <Space size={'large'} style={{marginBottom:'10px'}}>
        <Button type='primary' disabled={!Object.keys(filters).length}  size='small' onClick={handleClearFilters}>Clear all Filters</Button>
        <Button type="primary" size='small'  onClick={refreshData} > Refresh Records </Button>
      </Space>
      <Table
        size="small"
        columns={columns}
        onChange={handleTablechange}
        rowKey={record => record.id}
        dataSource={manualJobs}
        pagination={{ pageSize: 10 }}
      />
    </React.Fragment>
  )
}

export default ManualJobsStatus
