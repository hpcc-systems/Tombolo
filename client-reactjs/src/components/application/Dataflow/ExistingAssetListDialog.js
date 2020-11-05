import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom';
import { Button, Form, Input, message, Popconfirm, Icon, Tooltip, Modal, Table, Select } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import useFileDetailsForm from '../../../hooks/useFileDetailsForm';
import { useSelector } from "react-redux";
import { hasEditPermission } from "../../common/AuthUtil.js";
import { Constants } from '../../common/Constants';
const Option = Select.Option;

function ExistingAssetListDialog({show, applicationId, selectedDataflow, assetType, onClose, onFileAdded, user}) {
  const [assets, setAssets] = useState([]);
  const [visible, setVisible] = useState(show);
  const { OpenDetailsForm } = useFileDetailsForm();
  const [showDetailsForm, setShowDetailsForm] = useState(false);

  useEffect(() => {
    if(applicationId) {
      fetchDataAndRenderTable();
    }
  }, []);

  useEffect(() => {
    if(showDetailsForm) {
      setVisible(false)
    }
  }, [showDetailsForm])

  const authReducer = useSelector(state => state.authenticationReducer);

  const fetchDataAndRenderTable = () => {
    let url='';
    switch(assetType) {
      case 'File':
        url = '/api/file/read/file_list?app_id='+applicationId;
        break;
      case 'Index':
        url = '/api/index/read/index_list?app_id='+applicationId;
        break;
      case 'Job':
      case 'Modeling':
      case 'Scoring':
      case 'ETL':
      case 'Query Build':
      case 'Data Profile':
        url = '/api/job/job_list?app_id='+applicationId;
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

  const handleClose = () => {
    setVisible(false)
    onClose();
  }

  const selectAsset = (record) => {
    let fileAddedResponse = {"title": record.title}
    switch(assetType) {
      case 'File':
        fileAddedResponse.fileId = record.id;
        break;
      case 'Index':
        fileAddedResponse.indexId = record.id;
        break;
      case 'Job':
      case 'Modeling':
      case 'Scoring':
      case 'ETL':
      case 'Query Build':
      case 'Data Profile':
        fileAddedResponse.jobId = record.id;
        break;
    }
    onFileAdded(fileAddedResponse);
    handleClose();
  }

  const handleNewAsset = () => {
    setShowDetailsForm(true)
  }

  const editingAllowed = hasEditPermission(authReducer.user);

  const assetColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: '35%'
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
        <Button className="btn btn-secondary btn-sm" onClick={() => selectAsset(record)}>Select</Button>
      </span>
  }];

  return (
    <React.Fragment>
      <Modal
          title={"Select from existing "+assetType}
          visible={visible}
          destroyOnClose={true}
          onCancel={handleClose}
          maskClosable={false}
          width="1200px"
          footer={[
            <Button key="submit" type="primary" onClick={handleNewAsset} className={"float-left"}>{"Create a new " + assetType} </Button>,
            <Button key="cancel" onClick={handleClose}>
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

      {showDetailsForm ?
        OpenDetailsForm({
          "type": assetType,
          "onRefresh":onFileAdded,
          "isNew":true,
          "selectedAsset": '',
          "applicationId": applicationId,
          "selectedDataflow": selectedDataflow,
          "onClose": handleClose,
          "user": user}) : null}
    </React.Fragment>
  )
}
export default ExistingAssetListDialog