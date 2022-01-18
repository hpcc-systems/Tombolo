import React, { useState, useEffect } from 'react'
import { Button,  Modal, Table } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"

import { useSelector } from "react-redux";
import { hasEditPermission } from "../../common/AuthUtil.js";
import { Constants } from '../../common/Constants';


function ExistingAssetListDialog({show, applicationId, dataflowId, assetType, handleClose}) {
  console.log(assetType)
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    if(applicationId) {
      fetchDataAndRenderTable();
    }
  }, []);


  const authReducer = useSelector(state => state.authenticationReducer);

  const fetchDataAndRenderTable = () => {
    let url='';
    switch(assetType) {
      case 'File':
        url = '/api/file/read/file_list?app_id='+applicationId+"&dataflowId="+dataflowId;
        break;
      case 'Index':
        url = '/api/index/read/index_list?app_id='+applicationId+"&dataflowId="+dataflowId;
        break;
      case 'Job':
      case 'Modeling':
      case 'Scoring':
      case 'ETL':
      case 'Query Build':
      case 'Data Profile':
        default:
        url = '/api/job/job_list?app_id='+applicationId+"&dataflowId="+dataflowId;
        break;
    }

    fetch(url, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      setAssets(data)
    }).catch(error => {
      console.log(error);
    });
  }

  const editingAllowed = hasEditPermission(authReducer.user);

  const assetColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: '35%'
  },
  {
    title: 'Title',
    dataIndex: 'title',
    width: '30%'
  },
  {
    title: 'Description',
    dataIndex: 'description',
    width: '35%',
  },
  {
    title: 'Created',
    dataIndex: 'createdAt',
    width: '30%',
    render: (text, record) => {
      let createdAt = new Date(text);
      return createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ createdAt.toLocaleTimeString('en-US')
    }
  },
  {
    width: '15%',
    title: 'Action',
    dataJob: '',
    className: editingAllowed ? "show-column" : "hide-column",
    render: (text, record) =>
      <span>
        <Button className="btn btn-secondary btn-sm" onClick={() => handleClose(record)}>Select</Button>
      </span>
  }];

  return (
    <React.Fragment>
      <Modal
          title={"Select from existing "+assetType}
          visible={show}
          destroyOnClose={true}
          onCancel={()=>handleClose()}
          maskClosable={false}
          width="1200px"
          footer={[
            <Button key="cancel" onClick={()=>handleClose()}>
              Cancel
            </Button>,
          ]}
        >
          <Table
            columns={assetColumns}
            rowKey={record => record.id}
            dataSource={assets}
            pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
          />
      </Modal>
    </React.Fragment>
  )
}
export default ExistingAssetListDialog