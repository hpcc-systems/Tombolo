import React, { useState, useEffect } from "react";
import { Button, message, Modal,  Table } from "antd/lib";
import { authHeader, handleError } from "../../common/AuthHeader.js";

import { useSelector } from "react-redux";
import { hasEditPermission } from "../../common/AuthUtil.js";
import { Constants } from "../../common/Constants";

function ExistingAssetListDialog({ show, applicationId, dataflowId, clusterId, assetType, onClose }) {
  const [assets, setAssets] = useState([]);
  const authReducer = useSelector((state) => state.authenticationReducer);
  const editingAllowed = hasEditPermission(authReducer.user);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (applicationId) {
      (async () => {
        const queryParams= `app_id=${applicationId}&dataflowId=${dataflowId}&clusterId=${clusterId}`
        const options = {
          File: `/api/file/read/file_list?${queryParams}`,
          Index: `/api/index/read/index_list?${queryParams}`,
          default: `/api/job/job_list?${queryParams}`, //  'Job'- 'Modeling'- 'Scoring'- 'ETL'- 'Query Build'- 'Data Profile'
        };

        const url = options[assetType] || options.default;

        try {
          const response = await fetch(url, { headers: authHeader() });
          if (!response.ok) handleError(response);
          const data = await response.json();
          setAssets(data);
        } catch (error) {
          console.log(`error`, error);
          message.error('Could not download assets list');
        }
      })();
    }
    return (()=>{ setLoading(false)})
  }, []);

  const assetColumns = [
    {
      title: "Name",
      dataIndex: "name",
      width: "35%",
    },
    {
      title: "Title",
      dataIndex: "title",
      width: "30%",
    },
    {
      title: "Description",
      dataIndex: "description",
      width: "35%",
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      width: "30%",
      render: (text, record) => {
        let createdAt = new Date(text);
        return ( createdAt.toLocaleDateString("en-US", Constants.DATE_FORMAT_OPTIONS) + " @ " + createdAt.toLocaleTimeString("en-US") );
      },
    },
    {
      width: "15%",
      title: "Action",
      dataJob: "",
      className: editingAllowed ? "show-column" : "hide-column",
      render: (text, record) => (
        <span>
          <Button className="btn btn-secondary btn-sm" onClick={() =>{
            setLoading(true);
            onClose(record);
          } 
          }>
            Select
          </Button>
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={"Select from existing " + assetType}
      visible={show}
      destroyOnClose={true}
      onCancel={() => {
        if (loading) return;
        onClose()
      }}
      maskClosable={false}
      width="1200px"
      footer={[
        <Button key="cancel" disabled={loading} onClick={() => onClose()}>
          Cancel
        </Button>,
      ]}
    >
      <Table
        loading={loading}
        columns={assetColumns}
        rowKey={(record) => record.id}
        dataSource={assets}
        pagination={{ pageSize: 10 }}
        scroll={{ y: 460 }}
        />
    </Modal>
  );
}
export default ExistingAssetListDialog;
