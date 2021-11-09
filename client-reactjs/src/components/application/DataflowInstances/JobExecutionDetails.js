import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom';
import { Table, Spin } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js";
import { Constants } from '../../common/Constants';
import { useSelector } from "react-redux";

function JobExecutionDetails({workflowDetails}) {
  console.log("<<<<<<<<<<<<<<< Work flow details", workflowDetails)
  const jobColumns = [
    {
      title: 'Job',
      dataIndex: 'name',
      width: '30%'
    },
    {
      title: 'Wuid',
      dataIndex: 'wuid',
      width: '20%'
    },
    {
      title: 'Date',
      dataIndex: 'updatedAt',
      render: (text, record) => {
        let updatedAt = new Date(text);
        return updatedAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ updatedAt.toLocaleTimeString('en-US')
      },
      width: '20%',
    },
    {
      title: 'Duration',
      dataIndex: 'wu_duration',
      width: '20%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: '20%',
    }
  ]
  return (
    <React.Fragment>
      <Table
        columns={jobColumns}
        rowKey={record => record.id}
        dataSource={workflowDetails.wuDetails}
        pagination={{ pageSize: 10 }} scroll={{ y: 190 }}
      />
    </React.Fragment>
    )
}

export default JobExecutionDetails;