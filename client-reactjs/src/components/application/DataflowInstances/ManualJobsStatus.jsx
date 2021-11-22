import React, {useEffect, useState} from 'react'
import { Table } from 'antd';
import { Constants } from '../../common/Constants';
import {Link} from "react-router-dom";

function ManualJobsStatus({workflowDetails}) {
  const [manualJobs, setManualJobs] = useState([]);
    //Table columns
    const columns = [
        {
          title: 'Job Name',
          dataIndex: 'name',
          width: '30%'
        },
          {
            title: 'Job Type',
            dataIndex: 'jobType',
            width: '30%'
          },
        {
            title: 'Notified To',
            dataIndex: 'notifiedTo',
            width: '30%'
          },
          {
            title: 'Notified On',
            dataIndex: 'notifiedOn',
            width: '30%',
            render :  (text, record) => {
              let updatedAt = new Date(text);
              return updatedAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ updatedAt.toLocaleTimeString('en-US')
            }
          },
          {
            title: 'status',
            dataIndex: 'status',
            width: '30%'
          },  {
            title: 'Responded On',
            dataIndex: 'respondedOn',
            width: '30%',
            render :  (text, record) => {
              let updatedAt = new Date(text);
              return text ? updatedAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ updatedAt.toLocaleTimeString('en-US') : ''
            }
          },
        {
            title: 'Result',
            dataIndex: 'result',
            width: '30%'
          }
    ]

    //Table Data - filter jobs with type manual
    useEffect(() => {
      if(workflowDetails){
      const manualJobs = workflowDetails.wuDetails.filter( item => item.jobType === "Manual" );
      setManualJobs(manualJobs)
      manualJobs.map(item => { 
                              item.name =  item?.name; 
                               item.notifiedTo = item.manualJob_meta?.notifiedTo;
                               item.notifiedOn = item.manualJob_meta?.notifiedOn;
                               item.respondedOn = item.manualJob_meta?.respondedOn;
                               item.result = item.manualJob_meta?.response
                              });
      }
  
    }, [workflowDetails])
    
    // JSX
    return (
        <div>
             <Table
            columns={columns}
            rowKey={record => record.id}
            dataSource={manualJobs}
            pagination={{ pageSize: 10 }} scroll={{ y: 190 }}
            />
        </div>
    )
}

export default ManualJobsStatus
