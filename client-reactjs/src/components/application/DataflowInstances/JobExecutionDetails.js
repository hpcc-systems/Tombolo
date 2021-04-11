import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom';
import { Table, Spin } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js";
import { useSelector } from "react-redux";

function JobExecutionDetails() {
  const assetReducer = useSelector(state => state.assetReducer);
  const [jobExecutionDetails, setJobExecutionDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const {id, applicationId} = assetReducer.selectedAsset;
  console.log(assetReducer)
  console.log(id)
  useEffect(() => {
    if(id) {
      getJobExecutionDetails();
    }
  }, [id])

  const getJobExecutionDetails = () => {
    setLoading(true);
    fetch("/api/job/jobExecutionDetails?id="+id+"&applicationId="+applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      setJobExecutionDetails(data);
      setLoading(false);
    })
    .catch(error => {
      console.log(error);
    });
  }

  const rowSelected = (record) => {

  }

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
      <Spin spinning={loading}>
        <Table
          columns={jobColumns}
          rowKey={record => record.id}
          dataSource={jobExecutionDetails}
          pagination={{ pageSize: 10 }} scroll={{ y: 190 }}
        />
      </Spin>
    </React.Fragment>
    )
}

export default JobExecutionDetails;