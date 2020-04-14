import React, { useState, useEffect } from 'react'
import { Table, message, Divider} from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js"

function AssociatedDataflows({assetName, assetType}) {
	const [data, setData] = useState([]);

	useEffect(() => {
  	fetchData();
	}, [])

	const fetchData = () => {
		fetch('/api/report/read/associatedDataflows?name='+assetName+'&type='+assetType, {
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

  const associatedDataflowCols = [{
    title: 'Title',
    dataIndex: 'title',
    width: '30%',
    render: (text, record) => 
      <span>
        <a href={"/"+record.application_id+"/dataflow"} target="_blank">{record.title}</a>
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