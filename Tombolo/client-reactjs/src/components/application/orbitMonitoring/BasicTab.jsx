// import React, { useState, useRef } from 'react';
// import { Form, Row, Col, AutoComplete, Spin, Select, Input } from 'antd';
// import { authHeader, handleError } from '../../common/AuthHeader.js';
// import { useSelector } from 'react-redux';
// import ObjectKeyValue from '../../common/ObjectKeyValue';
// import { handleError as handleResponseError } from '../../../utils/handleResponse';

// import styles from './orbitMonitoring.module.css';

// const BasicTab = ({
//   orbitBuildDetails,
//   setOrbitBuildDetails,
//   selectedOrbitBuild,
//   setSelectedOrbitBuild,
//   monitoringDetails,
//   setMonitoringDetails,
//   businessUnits,
//   products,
//   domainLoading,
//   domainStatus,
//   productLoading,
//   productStatus,
// }) => {
//   const [orbitBuildSuggestions, setOrbitBuildSuggestions] = useState([]);
//   const [displayBuildInfo, setDisplayBuildInfo] = useState();
//   const [loading, setLoading] = useState(false);
//   const [status, setStatus] = useState(null);

//   const searchRef = useRef(null);

//   const applicationId = useSelector((state) => state.application.application.applicationId);

//   const handleOrbitBuildSelect = async (selectedOrbitBuild) => {
//     setSelectedOrbitBuild(selectedOrbitBuild);
//     try {
//       const url = `/api/orbit/getOrbitBuildDetails/${selectedOrbitBuild} `;
//       const response = await fetch(url, { headers: authHeader() });
//       if (!response.ok) handleError(response);
//       let buildInfo = await response.json();

//       const { Name, EnvironmentName, Status_DateCreated, Status_Code, HpccWorkUnit, Substatus_Code } = buildInfo;

//       buildInfo = {
//         Name: Name,
//         Environment: EnvironmentName,
//         'Most Recent Status': Status_Code,
//         'Most Recent SubStatus': Substatus_Code,
//         'Date Upated': Status_DateCreated,
//         WorkUnit: HpccWorkUnit,
//       };

//       setDisplayBuildInfo(buildInfo);

//       setOrbitBuildDetails(buildInfo);
//     } catch (error) {
//       console.log(error);
//       handleResponseError('There was an error getting file information from the cluster. Please try again');
//     }
//   };

//   //loader to get suggestions
//   const loadOrbitBuildSuggestions = async (searchText) => {
//     setLoading(true);
//     setStatus('warning');
//     setSelectedOrbitBuild(searchText);
//     if (searchText.length <= 3) {
//       setLoading(false);
//       setStatus(null);
//       return;
//     }
//     if (!searchText.match(/^[a-zA-Z0-9:_ -]*$/)) {
//       return handleResponseError('Invalid search keyword. Please remove any special characters from the keyword.');
//     }
//     try {
//       const options = {
//         method: 'GET',
//         headers: authHeader(),
//       };
//       const response = await fetch(`/api/orbit/search/${applicationId}/${searchText}`, options);
//       if (!response.ok) handleError(response);

//       const suggestions = await response.json();

//       const finalSuggestions = [];

//       await suggestions.map((build) => {
//         finalSuggestions.push({ value: build.Name, label: build.Name });
//       });

//       //if the searchText being returned isn't the same as the current value, then don't update the suggestions
//       if (searchText === searchRef.current) {
//         setOrbitBuildSuggestions(finalSuggestions);
//         setLoading(false);
//         setStatus(null);
//       }
//     } catch (error) {
//       console.log(error);
//       handleResponseError('There was an error getting Builds from Orbit');
//       setLoading(false);
//       setStatus('error');
//     }
//   };

//   return (
//     <>
//       <Form.Item
//         label="Domain"
//         className="medium-form-item"
//         name="businessUnit"
//         rules={[{ required: true, message: 'Required field' }]}>
//         <Select
//           placeholder={domainLoading ? 'Fetching Options..' : 'Select one'}
//           mode="single"
//           options={businessUnits}
//           loading={domainLoading}
//           status={domainStatus}
//           onChange={(value) => {
//             setMonitoringDetails({
//               ...monitoringDetails,
//               businessUnit: value,
//             });
//           }}></Select>
//       </Form.Item>
//       <Form.Item
//         label="Product Category"
//         className="medium-form-item"
//         name="product"
//         rules={[{ required: true, message: 'Required field' }]}>
//         <Select
//           placeholder={productLoading ? 'Fetching Options..' : 'Select one'}
//           mode="single"
//           options={products}
//           loading={productLoading}
//           status={productStatus}
//           onChange={(value) => {
//             setMonitoringDetails({
//               ...monitoringDetails,
//               product: value,
//             });
//           }}></Select>
//       </Form.Item>

//       <Form.Item
//         label="Host"
//         name="host"
//         validateTrigger={['onChange', 'onBlur']}
//         className="medium-form-item"
//         rules={[
//           { required: true, message: 'Required field' },
//           {
//             max: 256,
//             message: 'Maximum of 256 characters allowed',
//           },
//         ]}>
//         <Input placeholder="Enter the Orbit server address"></Input>
//       </Form.Item>

//       <Form.Item label="Search For Build" name="build" required rules={[{ required: true, message: 'Required field' }]}>
//         <Row gutter={[8, 0]}>
//           <Col className={styles.largeFormItem}>
//             <AutoComplete
//               options={orbitBuildSuggestions}
//               onSelect={handleOrbitBuildSelect}
//               onSearch={(searchText) => {
//                 searchRef.current = searchText;

//                 loadOrbitBuildSuggestions(searchText);
//               }}
//               value={selectedOrbitBuild}
//               status={status}></AutoComplete>
//             <Spin spinning={loading} className={styles.spinner}></Spin>
//           </Col>
//         </Row>
//       </Form.Item>

//       {orbitBuildDetails ? (
//         <>
//           {displayBuildInfo ? (
//             <>
//               <div className={styles.buildDetailsHeader}>Build Details</div>
//               <div className={styles.buildDetails}>
//                 <ObjectKeyValue obj={displayBuildInfo} />
//               </div>
//             </>
//           ) : null}
//         </>
//       ) : null}
//     </>
//   );
// };

// export default BasicTab;
