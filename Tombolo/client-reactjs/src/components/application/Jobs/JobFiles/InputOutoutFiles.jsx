// import React, { useState } from 'react';
// import { Table, message, Form, Select, Button, Tag } from 'antd';

// import { authHeader } from '../../../common/AuthHeader';
// import Text from '../../../common/Text';

// const { Option } = Select;

// //TAGS STYLE
// const renderTag = (record) => {
//   switch (record.assetType) {
//     case 'File Template':
//       return (
//         <Tag style={{ color: 'var(--primary)', border: '2px solid var(--primary)' }}>
//           <Text>File Template</Text>
//         </Tag>
//       );
//     case 'Super File':
//       return (
//         <Tag style={{ color: 'var(--indigo)', border: '2px solid var(--indigo)' }}>
//           <Text>Super File</Text>
//         </Tag>
//       );
//     default:
//       return (
//         <Tag style={{ color: 'var(--secondary)', border: '2px solid var(--secondary)' }}>
//           <Text>Logical File</Text>
//         </Tag>
//       );
//   }
// };

// function InputOutputFiles({ state, setState, editingAllowed, type, label }) {
//   const { sourceFiles, job, selectedCluster: clusterId, enableEdit, selectedInputFile, selectedOutputFile } = state;
//   const dataSource = type === 'input' ? job.inputFiles : job.outputFiles;

//   const [subFiles, setSubFiles] = useState([]);
//   const [expandedRowKeys, setExpandedRowKeys] = useState({ parentTable: [], fileTable: [], subFileTable: [] });
//   const [fetchingSubFiles, setFetchingSubFiles] = useState(false);

//   // PARENT AND FILE TABLE COLUMNS
//   const fileTableColumns = [
//     {
//       title: <Text text="File" />,
//       render: (text, record) => (
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <span>{record.fileTitle || record.name}</span>
//           {record.assetType === 'File Template' ? (
//             <small style={{ color: 'var(--primary)' }}>
//               [{record.files.length > 1 ? record.files.length + ' Files' : record.files.length + ' File'} ]
//             </small>
//           ) : null}
//         </div>
//       ),
//     },
//     {
//       title: <Text text="Type" />,
//       width: '8%',
//       render: (text, record) => renderTag(record),
//     },
//     {
//       title: <Text text="Description" />,
//       dataIndex: 'description',
//       width: '42%',
//     },
//   ];

//   // FUNCTION THAT RENDER'S FILE TABLE
//   const renderFilesTable = (record, _subFiles, _clusterId) => {
//     return (
//       <Table
//         columns={fileTableColumns}
//         dataSource={record.files}
//         rowKey={(record) => record.id}
//         expandable={{
//           rowExpandable: (record) => record.assetType === 'Super File',
//           expandedRowRender: (record) => renderSubFilesTable(record),
//           onExpand: (expanded, record) => handleRowExpansion({ expanded, record, table: 'fileTable' }),
//           expandedRowKeys: expandedRowKeys.fileTable,
//         }}
//         pagination={false}
//         showHeader={false}
//       />
//     );
//   };

//   // FUNCTION THAT RENDERS SUB-FILE TABLE
//   const renderSubFilesTable = (_record) => {
//     return (
//       <Table
//         columns={[{ title: 'Name' }]}
//         dataSource={subFiles}
//         rowKey={(record) => record.id}
//         size="small"
//         pagination={{ size: 'small', pageSize: 5 }}
//         showHeader={false}
//         loading={fetchingSubFiles}
//         expandable={{
//           rowExpandable: (record) => record.assetType === 'Super File',
//           expandedRowRender: (record) => renderFilesTable(record),
//           onExpand: (expanded, record) => handleRowExpansion({ expanded, record, table: 'subFileTable' }),
//           expandedRowKeys: expandedRowKeys.subFileTable,
//         }}
//       />
//     );
//   };

//   // FUNCTION THAT DOES SUB-FILE FETCHING
//   const fetchSubFiles = async (record) => {
//     try {
//       setFetchingSubFiles(true);
//       setSubFiles([]);
//       const response = await fetch(`/api/file/read/getSubFiles?fileName=${record.name}&clusterId=${clusterId}`, {
//         headers: authHeader(),
//       });
//       if (!response.ok) throw Error('Unable to fetch sub-files');
//       const subFiles = await response.json();
//       setSubFiles(subFiles);
//       setFetchingSubFiles(false);
//     } catch (err) {
//       console.log(err);
//       setFetchingSubFiles(false);
//       message.error(err.message);
//     }
//   };

//   // WHEN + OR - ICON IS CLICKED TO EXPAND OR COLLAPSE THE ROW
//   const handleRowExpansion = ({ expanded, record, table }) => {
//     if (expanded) {
//       let activeRows = { ...expandedRowKeys };
//       if (record.assetType === 'Super File') fetchSubFiles(record);

//       activeRows[table] = [record.id];
//       setExpandedRowKeys(activeRows);
//     } else {
//       let activeRows = { ...expandedRowKeys };
//       activeRows[table] = [];
//       setExpandedRowKeys(activeRows);
//     }
//   };

//   const onChange = (value) => {
//     setState(type === 'input' ? { selectedInputFile: value } : { selectedOutputFile: value });
//   };

//   const onClick = () => {
//     const selectedFile = this.state.sourceFiles.find(
//       (sourceFile) => sourceFile.id === (type === 'input' ? selectedInputFile : selectedOutputFile)
//     );
//     selectedFile.addedManually = true;

//     const updateInput = { job: { ...state.job, inputFiles: [...job.inputFiles, selectedFile] } };
//     const updateOutput = { job: { ...state.job, outputFiles: [...job.outputFiles, selectedFile] } };

//     setState(type === 'input' ? updateInput : updateOutput);
//   };

//   // JSX
//   return (
//     <>
//       <div>
//         {enableEdit ? (
//           <div style={{ display: 'flex' }}>
//             <Form.Item label={<Text text={label} />} rules={[{ required: true }]}>
//               <Select placeholder={label} onChange={onChange} style={{ width: 290 }} disabled={!editingAllowed}>
//                 {sourceFiles.map((d) => (
//                   <Option value={d.id} key={d.id}>
//                     {d.title ? d.title : d.name}
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>

//             <Form.Item style={{ marginLeft: '10px' }}>
//               <Button style={{ marginRight: '10px' }} type="primary" onClick={onClick} disabled={!editingAllowed}>
//                 <Text text="Add" />
//               </Button>
//             </Form.Item>
//           </div>
//         ) : null}
//       </div>

//       <Table
//         columns={fileTableColumns}
//         dataSource={dataSource}
//         rowKey={(record) => record.id}
//         size="small"
//         expandable={{
//           rowExpandable: (record) => record.assetType === 'File Template' || record.assetType === 'Super File',
//           expandedRowRender: (record) =>
//             record.assetType === 'File Template' ? renderFilesTable(record) : renderSubFilesTable(record),
//           expandedRowKeys: expandedRowKeys.parentTable,
//           onExpand: (expanded, record) => handleRowExpansion({ expanded, record, table: 'parentTable' }),
//         }}
//         bordered={true}
//         pagination={false}
//       />
//     </>
//   );
// }

// export default InputOutputFiles;
