import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom';
import { Table, Spin } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js";
import { useSelector } from "react-redux";

function JobExecutionDetails({workflowDetails}) {

  const jobColumns = [
    {
      title: 'Wuid',
      dataIndex: 'wuid',
      render: (text, record) => <a onClick={(row) => this.rowSelected(record)}>{text}</a>,
      width: '20%'
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: '20%',
    },
    {
      title: 'Start',
      dataIndex: 'wu_start',
      width: '30%',
    },
    {
      title: 'End',
      dataIndex: 'wu_end',
      width: '30%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: '30%',
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