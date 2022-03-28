import React, {useEffect, useState} from 'react'
import { Constants } from '../../common/Constants';
import { Table, Typography } from 'antd/lib';

const { Paragraph, Text} = Typography;

function ManualJobsStatus({workflowDetails, manageJobExecutionFilters, jobExecutionTableFilters}) {

  const [manualJobs, setManualJobs] = useState([]);
  
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
        width: '15%',
        sorter: (a, b) => a.name.localeCompare(b.name),
        onFilter: (value, record) => record.name.includes(value),
        filters: createUniqueFiltersArr(manualJobs,'name'),
        filteredValue: jobExecutionTableFilters.name || null,
      },
      {
        title: 'Notified To',
        dataIndex: 'notifiedTo',
        width: '15%',
        onFilter: (value, record) => record.notifiedTo.includes(value),
        filters: createUniqueFiltersArr(manualJobs, 'notifiedTo'),
        filteredValue: jobExecutionTableFilters.notifiedTo || null,
      },
      {
        title: 'Notified On',
        dataIndex: 'notifiedOn',
        width: '15%',
        defaultSortOrder: 'ascend',
        render :  (text, record) => {
          let updatedAt = new Date(text);
          return text ? updatedAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ updatedAt.toLocaleTimeString('en-US') : ''
        },
        sorter: (a, b) => new Date(b.notifiedOn) - new Date(a.notifiedOn),
        onFilter: (value, record) =>{
          const notifiedOn = new Date(record.notifiedOn).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
          return notifiedOn.includes(value)},
        filters: createUniqueFiltersArr(manualJobs,'notifiedOn'),
        filteredValue: jobExecutionTableFilters.notifiedOn || null,
      },
      {
        title: 'Responded On',
        dataIndex: 'respondedOn',
        width: '15%',
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
        filteredValue: jobExecutionTableFilters.respondedOn || null,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: '5%',
        sorter: (a, b) => a.status.localeCompare(b.status),
        onFilter: (value, record) => record.status.includes(value),
        filters: createUniqueFiltersArr(manualJobs, 'status'),
        filteredValue: jobExecutionTableFilters.status || null,
      },

      {
        title: 'Response Message',
        dataIndex: 'responseMessage',
        width: '35%',
        render : (text) =>{  
            return <Paragraph ellipsis={{
              rows: 2,
              tooltip: text,
            }}> {text} 
            </Paragraph>}
          },
      
  ]

  //Table Data - filter jobs with type manual
  useEffect(() => {
    if(workflowDetails){
    const manualJobs = workflowDetails.wuDetails.reduce((acc,el) =>{
      if(el.jobType === 'Manual') {
        const record = {
          id : el.id,
          name: el.name,
          status:el.status,
          notifiedTo: el.manualJob_meta?.notifiedTo,
          notifiedOn: el.manualJob_meta?.notifiedOn,
          respondedOn: el.manualJob_meta?.respondedOn,
          result: el.manualJob_meta?.response,
          responseMessage : el.manualJob_meta?.responseMessage
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
    manageJobExecutionFilters(activeFilters)
  }
  
  // JSX
  return (
    <React.Fragment>
      <Table
        size="small"
        columns={columns}
        onChange={handleTablechange}
        rowKey={(record) => record.id}
        dataSource={manualJobs}
        pagination={{ pageSize: 10 }}
      />
    </React.Fragment>
  )
}

export default ManualJobsStatus
