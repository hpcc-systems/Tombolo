import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router';
import { useSelector, useDispatch } from "react-redux";
import { Table } from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { dataflowAction } from '../../redux/actions/Dataflow';

function AssociatedDataflows({assetId, assetType}) {
  const history = useHistory();
  const applicationReducer = useSelector(state => state.applicationReducer);
  const user = useSelector(state => state.applicationReducer.application.user);
	const [data, setData] = useState([]);
  const dispatch = useDispatch();

	useEffect(() => {
  	fetchData();
	}, [])

	const fetchData = () => {
		fetch('/api/report/read/associatedDataflows?assetId='+assetId+'&type='+assetType, {
      headers: authHeader(),
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      setData(data);
    }).catch(error => {
      console.log(error);
    });
  }

  const onDataflowClick = (applicationId, dataflowId, clusterId) => {
    dispatch(dataflowAction.dataflowSelected(
      applicationReducer.application.applicationId,
      applicationReducer.application.applicationTitle,
      dataflowId,
      clusterId,
      user
    ));
    history.push(`/${applicationId}/dataflow/details/${dataflowId}`);
  }

  const associatedDataflowCols = [{
    title: 'Title',
    dataIndex: 'title',
    width: '30%',
    render: (text, record) =>
      <span>
        <a onClick={() => onDataflowClick(record.application_id, record.id, record.clusterId)} rel="noopener noreferrer">{record.title}</a>
      </span>

  },
  {
    title: 'Description',
    dataIndex: 'description',
    width: '30%',
  }];

  return (
	  <React.Fragment>
		  <Table
        columns={associatedDataflowCols}
        rowKey={record => record.id}
        dataSource={data}
        pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
			/>
		</React.Fragment>
	)


}
export default AssociatedDataflows