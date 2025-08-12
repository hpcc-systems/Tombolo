import React from 'react';
import { Menu, Dropdown, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';

// import { handleLzBulkDelete } from './Utils';
// import { toggleLzMonitoringStatus } from './Utils';

// const { Option } = Select;

const ActionButton = ({
  setDisplayAddEditModal,
  //   // handleAddNewLzMonitoringBtnClick,
  //   // selectedRows,
  //   // setSelectedRows,
  //   // setLandingZoneMonitoring,
  //   // setBulkEditModalVisibility,
  //   // setBulkApprovalModalVisibility,
  //   // isReader,
  //   // setFiltersVisible,
  //   // filtersVisible,
  //   // landingZoneMonitoring,
}) => {
  //   const [bulkStartPauseForm] = Form.useForm(); // Form Instance

  //   //Change filter visibility
  //   const changeFilterVisibility = () => {
  //     localStorage.setItem('jMFiltersVisible', !filtersVisible);
  //     setFiltersVisible((prev) => !prev);
  //   };

  //   const deleteSelected = async () => {
  //     try {
  //       const selectedRowIds = selectedRows.map((row) => row.id);
  //       // const res = await handleLzBulkDelete({ ids: selectedRowIds });
  //       setLandingZoneMonitoring((prev) =>
  //         prev.filter((landingZoneMonitoring) => !selectedRowIds.includes(landingZoneMonitoring.id))
  //       );
  //       setSelectedRows([]);

  //       // if (res) {
  //       //   message.success('Selected landing zone monitorings deleted successfully');
  //       // }
  //     } catch (err) {
  //       message.error('Unable to delete selected landing zone monitorings: ' + err);
  //     }
  //   };

  const handleMenuSelection = (key) => {
    if (key === '1') {
      setDisplayAddEditModal(true);
    }
    // else if (key === '2') {
    //       setBulkEditModalVisibility(true);
    //     } else if (key === '3') {
    //       setBulkApprovalModalVisibility(true);
    //     } else if (key === '5') {
    //       changeFilterVisibility();
    //     }
    //   };

    //   // Bulk start/pause job monitorings
    //   const bulkStartPauseJobMonitorings = async () => {
    //     try {
    //       const action = bulkStartPauseForm.getFieldValue('action'); // Ensure correct usage of bulkStartPauseForm
    //       if (action === 'start') {
    //         const selectedIncludesUnApprovedMonitorings = selectedRows.some((row) => row.approvalStatus !== 'approved');
    //         if (selectedIncludesUnApprovedMonitorings) {
    //           message.error('Selected job monitorings must be approved before starting');
    //           return;
    //         }
    //       }
    //       const startMonitoring = action === 'start' ? true : false;
    //       const selectedRowIds = selectedRows.map((row) => row.id);
    //       // await toggleLzMonitoringStatus({ ids: selectedRowIds, isActive: startMonitoring });
    //       const updatedLandingZoneMonitorings = landingZoneMonitoring.map((lz) => {
    //         if (selectedRowIds.includes(lz.id)) {
    //           return { ...lz, isActive: startMonitoring };
    //         }
    //         return lz;
    //       });
    //       setLandingZoneMonitoring(updatedLandingZoneMonitorings);
    //       message.success(`Selected ${action === 'start' ? 'Job Monitorings started' : 'Job Monitorings paused'}`);
    //     } catch (err) {
    //       message.error('Unable to start/pause selected job monitorings');
    //     }
  };

  // Action button menu items
  const menuItems = [
    {
      key: '1',
      label: 'Add New',
    },
    //     {
    //       key: '2',
    //       label: 'Bulk Edit',
    //       disabled: selectedRows.length < 2,
    //     },
    //     {
    //       key: '3',
    //       label: 'Bulk Approve or Reject',
    //       disabled: selectedRows.length < 2,
    //     },
    //     {
    //       key: '6',
    //       label: (
    //         <Popover
    //           placement="left"
    //           content={
    //             <Card size="small">
    //               <Form layout="vertical" form={bulkStartPauseForm}>
    //                 <Form.Item label="Select Action" name="action" required>
    //                   <Select style={{ width: '18rem' }}>
    //                     <Option value="start">
    //                       <Badge color="green" style={{ marginRight: '1rem' }}></Badge>
    //                       {`Start selected ${selectedRows.length} Job Monitoring`}
    //                     </Option>
    //                     <Option value="pause">
    //                       <Badge color="red" style={{ marginRight: '1rem' }}></Badge>
    //                       {`Pause selected ${selectedRows.length} Job Monitoring`}
    //                     </Option>
    //                   </Select>
    //                 </Form.Item>
    //                 <Form.Item>
    //                   <Button type="primary" style={{ width: '100%' }} onClick={bulkStartPauseJobMonitorings}>
    //                     Apply
    //                   </Button>
    //                 </Form.Item>
    //               </Form>
    //             </Card>
    //           }
    //           trigger="click">
    //           <a>Bulk start/pause</a>
    //         </Popover>
    //       ),
    //       disabled: selectedRows.length < 2,
    //     },
    //     {
    //       key: '4',
    //       label: (
    //         <Popconfirm
    //           title={`Are you sure you want to delete selected ${selectedRows.length} monitorings?`}
    //           okButtonProps={{ type: 'primary', danger: true }}
    //           okText="Delete"
    //           onConfirm={deleteSelected}>
    //           Bulk Delete
    //         </Popconfirm>
    //       ),
    //       disabled: selectedRows.length < 2,
    //     },
    //     {
    //       key: '5',
    //       label: filtersVisible ? 'Hide filters' : 'Show filters',
    //     },
  ];

  return (
    <Dropdown
      // disabled={isReader}
      dropdownRender={() => <Menu onClick={({ key }) => handleMenuSelection(key)} items={menuItems} />}>
      <Button type="primary">
        Cluster Monitoring Actions <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default ActionButton;
