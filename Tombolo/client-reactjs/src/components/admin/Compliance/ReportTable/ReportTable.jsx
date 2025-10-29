// import React from 'react';
// import { FileTextOutlined, TagOutlined } from '@ant-design/icons';
// import { Divider, Space, Table, Tag, Collapse, Typography, Tooltip } from 'antd';
// import ConstraintsTags from '../Constraints/ConstraintsTags';
// import BaseLine from './BaseLine';
// import CountTags from './CountTags';
// import DeleteReport from './DeleteReport';

// import { useSelector } from 'react-redux';
// import Text from '../../../common/Text';

// const ReportTable = ({ type = 'current', data = null }) => {
//   const applicationId = useSelector((state) => state.application.application.applicationId);
//   const reports = useSelector((state) => state.propagation.reports);
//   const report = useSelector((state) => state.propagation[type]);

//   let columns = [
//     {
//       title: <Text>Reports</Text>,
//       dataIndex: 'createdAt',
//       sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
//       render: (text, record) => (
//         <>
//           {new Date(text).toLocaleString()}
//           {!record.isBaseLine ? null : (
//             <Tag style={{ marginLeft: '15px' }} icon={<TagOutlined />} color="success">
//               <Text>Base line report</Text>
//             </Tag>
//           )}
//         </>
//       ),
//     },
//     {
//       title: <Text>Action</Text>,
//       key: 'x',
//       render: (record) => (
//         <Space split={<Divider type="vertical" />}>
//           {type === 'changes' ? null : <BaseLine record={record} />}
//           <DeleteReport record={record} />
//         </Space>
//       ),
//     },
//   ];

//   const getColumns = () => {
//     if (data) return [columns[0]];
//     if (type === 'changes') {
//       const comparedTo = {
//         title: <Text>Compared to base line</Text>,
//         dataIndex: 'comparedName',
//         render: (text) => (text ? new Date(text).toLocaleString() : ''),
//       };
//       return [columns[0], comparedTo, columns[1]];
//     }
//     return columns;
//   };

//   const dataSource = data || reports.filter((r) => r.type === type);

//   if (!report) return 'Wrong report type passed!';

//   return (
//     <Table
//       size="small"
//       columns={getColumns()}
//       pagination={false}
//       loading={data ? false : report.loading}
//       rowKey={(record) => record.id}
//       dataSource={dataSource}
//       expandable={{
//         expandedRowRender: (record) => {
//           const innerColumns = [
//             {
//               title: <Text>Field</Text>,
//               dataIndex: 'name',
//               width: '20%',
//               sorter: (a, b) => a.name.localeCompare(b.name),
//             },
//           ];

//           const options = {
//             changes: [
//               {
//                 title: <Text>Added</Text>,
//                 dataIndex: 'added',
//                 width: '40%',
//                 key: 'id',
//                 render: (text, record) => {
//                   return <ConstraintsTags list={record.added} />;
//                 },
//               },
//               {
//                 title: <Text>Removed</Text>,
//                 dataIndex: 'removed',
//                 key: 'id',
//                 width: '40%',
//                 render: (text, record) => {
//                   return <ConstraintsTags list={record.removed} />;
//                 },
//               },
//             ],
//             current: [
//               {
//                 title: <Text>Own</Text>,
//                 dataIndex: 'own',
//                 key: 'id',
//                 width: '20%',
//                 render: (text, record) => {
//                   return <ConstraintsTags list={record.own} />;
//                 },
//               },
//               {
//                 title: <Text>Inherited</Text>,
//                 dataIndex: 'inherited',
//                 width: '20%',
//                 key: 'id',
//                 render: (text, record) => {
//                   return <ConstraintsTags list={record.inherited} />;
//                 },
//               },
//             ],
//           };

//           // if type is passed, then add column
//           if (options[type]) innerColumns.push(...options[type]);

//           return (
//             <Collapse bordered>
//               {record.report.map((file, index) => {
//                 const header = (
//                   <Space split={<Divider type="vertical" />}>
//                     <CountTags file={file} reportType={type}>
//                       <Typography.Text style={{ color: '#1890ff' }}>
//                         <Space>
//                           <FileTextOutlined />
//                           {file.name}
//                           <Tooltip title={<Text>Open in new tab</Text>}>
//                             <Typography.Link target={'_blank'} href={`/${applicationId}/assets/file/${file.id}`}>
//                               <i className="fa fa-external-link" aria-hidden="true" />
//                             </Typography.Link>
//                           </Tooltip>
//                         </Space>
//                       </Typography.Text>
//                     </CountTags>
//                   </Space>
//                 );

//                 return (
//                   <Collapse.Panel key={index} header={header}>
//                     <Table
//                       bordered
//                       size="small"
//                       columns={innerColumns}
//                       pagination={false}
//                       dataSource={file.fields}
//                       rowKey={(field) => field.name}
//                     />
//                   </Collapse.Panel>
//                 );
//               })}
//             </Collapse>
//           );
//         },
//       }}
//     />
//   );
// };

// export default ReportTable;
