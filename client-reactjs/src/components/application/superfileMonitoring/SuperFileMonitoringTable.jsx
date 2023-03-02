import React, { useState, useEffect } from 'react';
import { Table, Space, Tooltip, Badge, message } from 'antd';
import { EyeOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, BellOutlined } from '@ant-design/icons';
import { authHeader, handleError } from '../../common/AuthHeader.js';
// import ObjectKeyValue from '../../common/ObjectKeyValue.jsx';
import useWindowSize from '../../../hooks/useWindowSize.js';
// import ObjectKeyValue from '../../common/ObjectKeyValue.jsx';
import { Link } from 'react-router-dom';

function SuperFileMonitoringTable({
  modalVisible,
  setModalVisible,
  superfileMonitoringList,
  setSuperFileMonitoringList,
  sizeFormatter,
  applicationId,
  setSelectedFileMonitoring,
}) {
  // const [details, setDetails] = useState(null);
  // const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [modalWidth, setModalWidth] = useState(0);
  const windowSize = useWindowSize();
  // Changes modal size per screen vw
  useEffect(() => {
    const { width } = windowSize.inner;
    if (width > 1500) {
      setModalWidth('40vw');
    } else if (width > 1000) {
      setModalWidth('60vw');
    } else {
      setModalWidth('100vw');
    }
  }, [windowSize]);

  // Delete record
  const deleteSuperFileMonitoring = async ({ id, name }) => {
    try {
      const payload = {
        method: 'DELETE',
        header: authHeader(),
      };

      const response = await fetch(`/api/superfilemonitoring/read/${id}/${name}`, payload);
      if (!response.ok) return handleError(response);
      const newSuperFileMonitoringList = superfileMonitoringList.filter((superfile) => superfile.id != id);
      setSuperFileMonitoringList(newSuperFileMonitoringList);
    } catch (err) {
      message.error('Failed to delete superfile monitoring ', err.message);
    }
  };

  const changeFileMonitoringStatus = async (id) => {
    try {
      const payload = {
        method: 'PUT',
        header: authHeader(),
      };

      const response = await fetch(`/api/superfilemonitoring/read/superfileMonitoringStatus/${id}`, payload);
      if (!response.ok) return handleError(response);
      const updatedMonitoringList = superfileMonitoringList.map((record) =>
        record.id === id ? { ...record, monitoringActive: !record.monitoringActive } : record
      );
      setSuperFileMonitoringList(updatedMonitoringList);
    } catch (err) {
      message.error('Failed to update file monitoring status');
    }
  };

  // //open details modal and set details data
  // const openDetailsModal = async (record) => {
  //   setDetailsModalVisible(true);

  //   let monitorDate = new Date(parseInt(record.lastMonitored));
  //   let fileDate = new Date(parseInt(record.mostRecentSubFileDate));

  //   const data = {
  //     Name: record.name,
  //     Superfile: record.superfile_name,
  //     Cluster: record.cluster,
  //     Cron: record.cron,
  //     Size: sizeFormatter(record.size),
  //     'Subfile Count': record.subfiles,
  //     'Most Recently Updated Subfile': record.mostRecentSubFile,
  //     'Most Recent Subfile Modified Date': fileDate.toLocaleString(),
  //     'Last Monitored': monitorDate.toLocaleString(),
  //   };

  //   setDetails(data);
  // };

  // const closeDetailsModal = () => {
  //   setDetailsModalVisible(false);
  //   setDetails(null);
  // };

  // View existing file monitoring  ------------------------------------------------------------------
  const viewExistingFileMonitoring = (id) => {
    setModalVisible(true);
    setSelectedFileMonitoring(id);

    //unused fields
    sizeFormatter;
    modalVisible;
    modalWidth;
  };
  const columns = [
    {
      title: 'Status',
      render: (_, record) => (
        <>
          <Badge
            color={record.monitoringActive ? 'green' : 'gray'}
            text={record.monitoringActive ? 'Active' : 'Paused'}
          />
        </>
      ),
    },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Cluster', dataIndex: 'cluster' },
    { title: 'Schedule', dataIndex: 'cron' },
    { title: 'SuperFile Name', dataIndex: 'superfile_name' },
    { title: 'Subfile Count', dataIndex: 'subfiles' },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <a>
            <Tooltip title="View">
              <EyeOutlined onClick={() => viewExistingFileMonitoring(record.id)} />
            </Tooltip>
          </a>
          {record.monitoringActive ? (
            <a>
              <Tooltip title="Pause Monitoring">
                <PauseCircleOutlined onClick={() => changeFileMonitoringStatus(record.id)} />
              </Tooltip>
            </a>
          ) : (
            <a>
              <Tooltip title="Resume Monitoring">
                <PlayCircleOutlined onClick={() => changeFileMonitoringStatus(record.id)} />
              </Tooltip>
            </a>
          )}
          <a>
            <Tooltip title="Delete Monitoring">
              <DeleteOutlined
                onClick={() => {
                  deleteSuperFileMonitoring({ id: record.id, name: record.name });
                }}
              />
            </Tooltip>
          </a>

          <a>
            <Tooltip title="Notifications">
              <Link to={`/${applicationId}/notifications?monitoringId=${record.id}`}>
                <BellOutlined />
              </Link>
            </Tooltip>
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table size="small" columns={columns} dataSource={superfileMonitoringList} rowKey={(record) => record.id} />
      {/* <Modal
        visible={detailsModalVisible}
        onOk={closeDetailsModal}
        width={modalWidth}
        onCancel={closeDetailsModal}
        maskClosable={false}>
        <ObjectKeyValue obj={details}></ObjectKeyValue>
      </Modal> */}
    </>
  );
}

export default SuperFileMonitoringTable;
