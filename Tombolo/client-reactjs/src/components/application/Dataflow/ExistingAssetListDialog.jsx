// import React, { useState, useEffect } from 'react';
// import { Button, message, Modal, Table, Tooltip } from 'antd';
// import { authHeader, handleError } from '../../common/AuthHeader.js';
// import { getRoleNameArray } from '../../common/AuthUtil.js';
//
// // import { hasEditPermission } from '../../common/AuthUtil.js';
// import { Constants } from '../../common/Constants';
//
// function ExistingAssetListDialog({ show, applicationId, clusterId, assetType, onClose, nodes }) {
//   const [assets, setAssets] = useState([]);
//
//   const roleArray = getRoleNameArray();
//   const editingAllowed = !(roleArray.includes('reader') && roleArray.length === 1);
//   const [loading, setLoading] = useState(false);
//
//   useEffect(() => {
//     if (applicationId) {
//       (async () => {
//         const queryParams = `application_id=${applicationId}&cluster_id=${clusterId}`;
//         const options = {
//           File: `/api/file/read/file_list?${queryParams}`,
//           FileTemplate: `/api/fileTemplate/read/fileTemplate_list?${queryParams}`,
//           Index: `/api/index/read/index_list?${queryParams}`,
//           Job: `/api/job/job_list?${queryParams}`, //  'Job'- 'Modeling'- 'Scoring'- 'ETL'- 'Query Build'- 'Data Profile'
//           default: `/api/job/job_list?${queryParams}`,
//         };
//
//         const url = options[assetType] || options.default;
//
//         try {
//           const response = await fetch(url, { headers: authHeader() });
//           if (!response.ok) handleError(response);
//           const data = await response.json();
//
//           const existingAssetsIds = nodes.map((node) => node.assetId);
//           const availableAssets = data.filter((asset) => !existingAssetsIds.includes(asset.id));
//
//           setAssets(availableAssets);
//         } catch (error) {
//           console.log('error', error);
//           message.error('Could not download assets list');
//         }
//       })();
//     }
//     return () => {
//       setLoading(false);
//     };
//   }, []);
//
//   const assetColumns = [
//     {
//       title: 'Name',
//       dataIndex: 'name',
//       width: '30%',
//       ellipsis: {
//         showTitle: false,
//       },
//       render: (text) => (
//         <Tooltip placement="topLeft" title={text}>
//           {text}
//         </Tooltip>
//       ),
//     },
//     {
//       title: 'Title',
//       dataIndex: 'title',
//       width: '20%',
//       ellipsis: {
//         showTitle: false,
//       },
//       render: (text) => (
//         <Tooltip placement="topLeft" title={text}>
//           {text}
//         </Tooltip>
//       ),
//     },
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       width: '35%',
//       ellipsis: {
//         showTitle: false,
//       },
//       render: (text) => (
//         <Tooltip placement="topLeft" title={text}>
//           {text}
//         </Tooltip>
//       ),
//     },
//     {
//       title: 'Created',
//       dataIndex: 'createdAt',
//       width: '20%',
//       ellipsis: {
//         showTitle: false,
//       },
//       render: (text) => {
//         let createdAt = new Date(text);
//         return (
//           <Tooltip
//             placement="topLeft"
//             title={
//               createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
//               ' @ ' +
//               createdAt.toLocaleTimeString('en-US')
//             }>
//             {createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
//               ' @ ' +
//               createdAt.toLocaleTimeString('en-US')}
//           </Tooltip>
//         );
//       },
//     },
//     {
//       width: '15%',
//       title: 'Action',
//       dataJob: '',
//       className: editingAllowed ? 'show-column' : 'hide-column',
//       render: (text, record) => (
//         <span>
//           <Button
//             type="primary"
//             onClick={() => {
//               setLoading(true);
//               onClose({
//                 ...record,
//                 assetType,
//               });
//             }}>
//             Select
//           </Button>
//         </span>
//       ),
//     },
//   ];
//
//   if (assetType === 'File') {
//     const isSuperFileColumn = {
//       title: 'Is Superfile?',
//       dataIndex: 'isSuperFile',
//       width: '16%',
//       render: (text) => `${text ? 'Yes' : 'No'}`,
//     };
//     assetColumns.splice(2, 0, isSuperFileColumn);
//   }
//
//   if (assetType === 'Job' || assetType === 'File') {
//     const isJobAssociated = {
//       title: 'Production',
//       width: '20%',
//       render: (text, record) => {
//         return record.isAssociated ? 'Yes' : 'No';
//       },
//     };
//     assetColumns.splice(2, 0, isJobAssociated);
//   }
//
//   const getModalTitle = () => {
//     let title = 'Select From Existing ';
//     if (assetType === 'FileTemplate') {
//       title += 'File Templates';
//     } else {
//       title += assetType;
//     }
//     return title;
//   };
//
//   return (
//     <Modal
//       title={getModalTitle()}
//       open={show}
//       destroyOnClose={true}
//       onCancel={() => {
//         if (loading) return;
//         onClose();
//       }}
//       maskClosable={false}
//       width="1200px"
//       footer={[
//         <Button key="cancel" disabled={loading} onClick={() => onClose()}>
//           Cancel
//         </Button>,
//       ]}>
//       <Table
//         loading={loading}
//         columns={assetColumns}
//         rowKey={(record) => record.id}
//         dataSource={assets}
//         pagination={{ pageSize: 10 }}
//         scroll={{ y: 460 }}
//       />
//     </Modal>
//   );
// }
// export default ExistingAssetListDialog;
