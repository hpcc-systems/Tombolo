// import React, { useState, useEffect, useRef } from 'react';
// import { Space, Table, Badge } from 'antd';
// import { useParams } from 'react-router-dom';
// import { Constants } from '../../common/Constants';
// import Text from '../../common/Text';
//
// //!! JEGroup - JOB EXECUTION GROUP
//
// function JobExecutionDetails({ jobExecutions, setFilters, selectJEGroup, JEGroupFilters, JEGroup }) {
//   const [JEGroupData, setJEGroupData] = useState([]);
//   const { executionGroupId } = useParams();
//
//   // Unique filters
//   const createUniqueFiltersArr = (baseArr, column) => {
//     const columnsNames = { createdAt: 'createdAt', name: 'name', wuid: 'wuid', status: 'status' };
//     if (!baseArr || !column || !columnsNames[column]) return [];
//     const dictionary = baseArr.reduce(
//       (acc, el) => {
//         let key = el[column] || 'empty';
//         if (column === 'createdAt') {
//           key = new Date(el.createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
//         }
//         if (!acc[key]) {
//           acc[key] = true;
//           acc.result.push({ text: key, value: key });
//         }
//         return acc;
//       },
//       { result: [] }
//     );
//     return dictionary.result;
//   };
//
//   // when the table changes - eg : sorting, filtering, pagination etc
//   const handleTableChange = (pagination, filters, _sorter) => {
//     const activeFilters = {};
//     for (const key in filters) filters[key] && (activeFilters[key] = filters[key]);
//     setFilters(activeFilters);
//   };
//
//   //Badge color
//   const setBadgeColor = (status) => {
//     const colors = {
//       completed: '#3bb44a',
//       compiled: '#3bb44a',
//       failed: '#FF0000',
//       blocked: '#FFA500',
//       'some-failed': '#FFA500',
//       default: '#808080',
//     };
//     return colors[status] || colors.default;
//   };
//
//   const getGroupStatus = (statuses) => {
//     if (statuses.every((status) => status === 'completed' || status === 'compiled')) return 'completed';
//     if (statuses.some((status) => status === 'failed' || status === 'error')) return 'failed';
//     if (statuses.some((status) => status === 'wait' || status === 'submitted')) return 'in-progress';
//     return 'some-failed';
//   };
//
//   const initLoad = useRef(true);
//   //When component loads, find the count of job execution with same job execution group ID and group them together
//   useEffect(() => {
//     if (jobExecutions.length > 0) {
//       const sortedJE = jobExecutions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
//
//       const groupExecutions = sortedJE.reduce((allGroups, execution) => {
//         const { createdAt, status, dataflowVersion } = execution;
//         const groupId = execution.jobExecutionGroupId;
//         const group = allGroups[groupId];
//
//         if (!group) {
//           const newGroup = {
//             count: 1,
//             createdAt,
//             dataflowVersion,
//             statuses: [status],
//             jobExecutionGroupId: groupId,
//           };
//           allGroups[groupId] = newGroup;
//         } else {
//           group.count += 1;
//           group.statuses.push(status);
//         }
//
//         return allGroups;
//       }, {});
//
//       setJEGroupData(Object.values(groupExecutions));
//
//       // On initial load we want to select first execution group but avoid this action next time, when poller updates jobExecutions list
//       if (initLoad.current) {
//         const JEGroupIds = Object.keys(groupExecutions);
//         const selectedGroup = executionGroupId || JEGroupIds[JEGroupIds.length - 1] || '';
//         selectJEGroup(selectedGroup);
//         initLoad.current = false;
//       }
//     }
//   }, [jobExecutions]);
//
//   // Function that renders a child table when + icon is clicked
//   const expandedRowRender = (record) => {
//     //Nested table columns
//     const jobExecutionTableColumns = [
//       { title: <Text text="Job" />, dataIndex: 'name', width: '20%' },
//       { title: 'Wuid', dataIndex: 'wuid', width: '20%' },
//       {
//         title: <Text text="Date" />,
//         width: '20%',
//         dataIndex: 'createdAt',
//         defaultSortOrder: 'descend',
//         sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
//         render: (text, _record) =>
//           new Date(text).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
//           ' @ ' +
//           new Date(text).toLocaleTimeString('en-US'),
//       },
//       {
//         title: <Text text="Status" />,
//         dataIndex: 'status',
//         width: '20%',
//         render: (text, record) => (
//           <span>
//             <Badge color={setBadgeColor(record.status)}></Badge>
//             {record.status}
//           </span>
//         ),
//       },
//       {
//         title: <Text text="Duration" />,
//         dataIndex: 'wu_duration',
//         width: '20%',
//         render: (text) => text || '0.000',
//       },
//     ];
//
//     //Nested table data
//     const jobExecutionData = jobExecutions.filter((item) => item.jobExecutionGroupId === record.jobExecutionGroupId);
//
//     return (
//       <Table
//         bordered
//         pagination={false}
//         rowKey={(record) => record.id}
//         dataSource={jobExecutionData}
//         columns={jobExecutionTableColumns}
//       />
//     );
//   };
//
//   //Parent, JOB EXECUTION GROUP, table columns
//   const JEGroupTableColumns = [
//     {
//       title: <Text text="Date" />,
//       dataIndex: 'createdAt',
//       defaultSortOrder: 'ascend',
//       filteredValue: JEGroupFilters.createdAt || null,
//       filters: createUniqueFiltersArr(jobExecutions, 'createdAt'),
//       sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
//       onFilter: (value, record) =>
//         value === new Date(record.createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS),
//       render: (text, record) => {
//         let createdAt = new Date(record.createdAt);
//         return (
//           <Space size="small">
//             <Badge color={setBadgeColor(getGroupStatus(record.statuses))}></Badge>
//             {createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
//               ' @ ' +
//               createdAt.toLocaleTimeString('en-US')}
//             <small>
//               <b>
//                 [ {record.count} job{record.count > 1 ? 's' : ''} ]
//               </b>
//             </small>
//           </Space>
//         );
//       },
//     },
//     {
//       title: <Text text="Version" />,
//       render: (text, record) => {
//         const version = record?.dataflowVersion;
//         if (!version) return '';
//         const liveBadge = version.isLive ? '(live version)' : '';
//         return (
//           <>
//             {version.name} {liveBadge}
//           </>
//         );
//       },
//     },
//   ];
//
//   return (
//     <React.Fragment>
//       <Table
//         size="small"
//         columns={JEGroupTableColumns}
//         onChange={handleTableChange}
//         rowKey={(record) => record.jobExecutionGroupId}
//         dataSource={JEGroupData}
//         expandRowByClick={true}
//         expandedRowKeys={[JEGroup]}
//         expandable={{ expandedRowRender }}
//         expandedRowClassName={() => 'jobExecutionDetails_antdTable_child'}
//         onExpand={(expanded, record) => selectJEGroup(expanded ? record.jobExecutionGroupId : '')}
//         rowClassName={(record) =>
//           JEGroup === record.jobExecutionGroupId ? 'jobExecutionDetails_antdTable_selectedRow' : ''
//         }
//         // pagination={{ pageSize: Math.abs(Math.round((windowHeight - graphSize.height) / 60 ))}}
//       />
//     </React.Fragment>
//   );
// }
//
// export default JobExecutionDetails;
