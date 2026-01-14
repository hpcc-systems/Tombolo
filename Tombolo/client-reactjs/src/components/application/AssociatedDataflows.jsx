// import React, { useState, useEffect } from 'react';
// import { useHistory } from 'react-router';
// import { useSelector, useDispatch } from 'react-redux';
// import { Table } from 'antd';
// import { authHeader, handleError } from '../common/AuthHeader.js';
// import Text from '../common/Text.jsx';
// import { dataflowSelected } from '@/redux/slices/DataflowSlice';

// function AssociatedDataflows({ assetId, assetType }) {
//   const history = useHistory();
//   const applicationId = useSelector((state) => state.application.application.applicationId);
//   const [data, setData] = useState([]);
//   const dispatch = useDispatch();

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = () => {
//     fetch(
//       '/api/report/read/associatedDataflows?assetId=' +
//         assetId +
//         '&type=' +
//         assetType +
//         '&application_id=' +
//         applicationId,
//       {
//         headers: authHeader(),
//       }
//     )
//       .then(function (response) {
//         if (response.ok) {
//           return response.json();
//         }
//         handleError(response);
//       })
//       .then(function (data) {
//         setData(data);
//       })
//       .catch((error) => {
//         console.log(error);
//       });
//   };

//   const onDataflowClick = ({ id, title, clusterId, application_id }) => {
//     dispatch(dataflowSelected({ id, title, clusterId }));
//     history.push(`/${application_id}/dataflow/details/${id}`);
//   };

//   const associatedDataflowCols = [
//     {
//       title: <Text text="Title" />,
//       dataIndex: 'title',
//       width: '30%',
//       render: (text, record) => (
//         <span>
//           <a
//             onClick={() => {
//               const { id, title, clusterId, application_id } = record;
//               onDataflowClick({ id, title, clusterId, application_id });
//             }}>
//             {record.title}
//           </a>
//         </span>
//       ),
//     },
//     {
//       title: <Text text="Description" />,
//       dataIndex: 'description',
//       width: '30%',
//     },
//   ];

//   return (
//     <React.Fragment>
//       <Table
//         columns={associatedDataflowCols}
//         rowKey={(record) => record.id}
//         dataSource={data}
//         pagination={{ pageSize: 10 }}
//         scroll={{ y: 460 }}
//       />
//     </React.Fragment>
//   );
// }
// export default AssociatedDataflows;
