// import React, { useState, useEffect } from 'react';
// import { useSelector } from 'react-redux';
// import { Button, Tooltip, Modal, Form, Input, Select, message } from 'antd';
//
// import { authHeader } from '../../common/AuthHeader.js';
// import NotifyField from '../Jobs/Notifications/RadioButtons';
// import UserSearch from '../../common/UserSearch';
// import Text from '../../common/Text';
//
// const { Option } = Select;
// const { TextArea } = Input;
//
// const formLayout = {
//   labelCol: { span: 3 },
//   wrapperCol: { span: 21 },
// };
//
// const noLabelLayout = {
//   wrapperCol: { offset: 3 },
// };
// // Var set outside, so change in these vars does not re-render component
// let selectedCluster = {};
//
// function AddDataflow({
//   modalVisible,
//   setModalVisibility,
//   dataflowToEdit,
//   setDataflowToEdit,
//   onDataFlowUpdated,
//   data,
//   enableEdit,
//   setEnableEdit,
// }) {
//   const [form] = Form.useForm();
//   const [application, clusters] = useSelector((state) => [state.application?.application, state.application?.clusters]);
//   const [notifyStatus, setNotifyStatus] = useState('Never');
//   const [showDetails, setShowDetails] = useState(false);
//   //  // t for translate -> getting namespaces relevant to this file
//
//   useEffect(() => {
//     //If user is editing or viewing DF details - Populate form fields
//     if (dataflowToEdit) {
//       console.log(dataflowToEdit);
//       const { id, title, description } = dataflowToEdit;
//       selectedCluster = clusters.filter((cluster) => cluster.id === dataflowToEdit.clusterId)[0];
//       setNotifyStatus(dataflowToEdit?.metaData?.notification?.notify);
//
//       form.setFieldsValue({
//         id,
//         title,
//         description,
//         cluster: selectedCluster?.name,
//         cluster_username: dataflowToEdit?.dataflow_cluster_credential?.cluster_username || '',
//         notify: dataflowToEdit?.metaData?.notification?.notify || 'Never',
//         notificationSuccessMessage: dataflowToEdit?.metaData?.notification?.success_message || '',
//         notificationFailureMessage: dataflowToEdit?.metaData?.notification?.failure_message || '',
//         notificationRecipients: dataflowToEdit?.metaData?.notification?.recipients,
//       });
//     }
//   }, [dataflowToEdit]);
//
//   //Handle Cluster change
//   const handleClusterChange = (clusterId) => {
//     selectedCluster = clusters.filter((cluster) => cluster.id === clusterId)[0];
//   };
//
//   const validateForms = async () => {
//     let validationError = null;
//     let formData = {};
//
//     try {
//       formData = await form.validateFields();
//     } catch (err) {
//       validationError = err;
//     }
//
//     return { validationError, formData };
//   };
//
//   //Handle submit function
//   const handleFormSubmission = async () => {
//     const errors = await validateForms();
//
//     if (!errors.validationError) {
//       saveDataflow(form.getFieldValue());
//     }
//   };
//
//   const saveDataflow = (formValues) => {
//     //Check for DF title uniqueness
//     if (data.some((dataflow) => dataflow.title === formValues.title && !dataflowToEdit)) {
//       message.error('A dataflow exists with the same name. Please pick a different name');
//       return;
//     }
//
//     fetch('/api/dataflow/save', {
//       method: 'post',
//       headers: authHeader(),
//       body: JSON.stringify({
//         id: dataflowToEdit?.id,
//         username: formValues.cluster_username,
//         password: formValues.cluster_password,
//         application_id: application.applicationId,
//         clusterId: selectedCluster.id,
//         description: formValues.description,
//         title: formValues.title,
//         metaData: {
//           notification: {
//             notify: formValues.notify,
//             recipients: formValues.notificationRecipients,
//             success_message: formValues.notificationSuccessMessage,
//             failure_message: formValues.notificationFailureMessage,
//           },
//         },
//       }),
//     })
//       .then(function (response) {
//         if (response.status === 403) {
//           form.setFields([
//             {
//               name: 'cluster_username',
//               errors: ['Invalid cluster credentials'],
//             },
//             {
//               name: 'cluster_password',
//               errors: ['Invalid cluster credentials'],
//             },
//           ]);
//           throw Error('Invalid cluster credentials');
//         } else if (response.status === 503) {
//           throw Error('Cluster not reachable');
//         }
//         return response.json();
//       })
//       .then(function (_data) {
//         message.success('Successfully created dataflow');
//         onDataFlowUpdated();
//         form.resetFields();
//         setEnableEdit(false);
//         setNotifyStatus('Never');
//         setShowDetails(false);
//         setDataflowToEdit(null);
//         setTimeout(() => {
//           setModalVisibility(false);
//         }, 300);
//       })
//       .catch((error) => {
//         message.error(error.message);
//       });
//   };
//
//   //Handle Modal close/cancel
//   const handleClose = () => {
//     form.resetFields();
//     setModalVisibility(false);
//     setEnableEdit(false);
//     setNotifyStatus('Never');
//     setShowDetails(false);
//     setDataflowToEdit(null);
//   };
//
//   //when add DF btn is clicked
//   const handleModal = () => {
//     setModalVisibility(true);
//     setEnableEdit(true);
//   };
//
//   return (
//     <React.Fragment>
//       <Tooltip placement="bottom" title={<Text text="Add new Dataflow" />}>
//         <Button type="primary" onClick={handleModal}>
//           {<Text text="Add" />}
//         </Button>
//       </Tooltip>
//
//       <Modal
//         open={modalVisible}
//         title={<Text text="Dataflow" />}
//         maskClosable={false}
//         styles={{ overflowY: 'auto', maxHeight: '60vh' }}
//         width={750}
//         onCancel={handleClose}
//         footer={[
//           <Button
//             key={1}
//             type="primary"
//             onClick={handleFormSubmission}
//             style={{ display: enableEdit ? 'inline' : 'none' }}>
//             {<Text text="Save" />}
//           </Button>,
//           <Button
//             key={2}
//             type="primary"
//             onClick={() => setEnableEdit(true)}
//             style={{ display: enableEdit ? 'none' : 'inline' }}>
//             {<Text text="Edit" />}
//           </Button>,
//           <Button key={3} onClick={handleClose}>
//             {<Text text="Cancel" />}
//           </Button>,
//         ]}>
//         <Form form={form} initialValues={{ notify: 'Never' }} {...formLayout} labelAlign="left">
//           <Form.Item
//             label={<Text text="Title" />}
//             name="title"
//             validateTrigger={['onChange', 'onBlur']}
//             rules={[
//               {
//                 required: enableEdit ? true : false,
//                 message: 'Please enter a valid title',
//               },
//               {
//                 max: 256,
//                 message: 'Maximum of 256 characters allowed',
//               },
//             ]}>
//             <Input placeholder={'Title'} className={enableEdit ? null : 'read-only-input'} />
//           </Form.Item>
//
//           <Form.Item
//             label={<Text text="Description" />}
//             name="description"
//             validateTrigger={['onChange', 'onBlur']}
//             rules={[
//               {
//                 required: enableEdit ? true : false,
//                 message: 'Please enter a valid title',
//               },
//               {
//                 max: 1024,
//                 message: 'Maximum of 1024 characters allowed',
//               },
//             ]}
//             className={enableEdit ? null : 'read-only-input'}>
//             <TextArea
//               autoSize={{ minRows: enableEdit ? 2 : 1 }}
//               placeholder={enableEdit ? 'Description' : 'Description not provided'}
//             />
//           </Form.Item>
//
//           <Form.Item
//             label={<Text text="Cluster" />}
//             name="cluster"
//             rules={[
//               {
//                 required: enableEdit ? true : false,
//                 message: 'Please select a cluster',
//               },
//             ]}
//             className={enableEdit ? null : 'read-only-input'}>
//             {enableEdit ? (
//               <Select onChange={handleClusterChange}>
//                 {clusters.map((cluster) => (
//                   <Option key={cluster.id}>{cluster.name}</Option>
//                 ))}
//               </Select>
//             ) : (
//               <Input />
//             )}
//           </Form.Item>
//
//           <Form.Item label={<Text text="Username" />} name="cluster_username">
//             <Input placeholder={'Cluster username'} className={enableEdit ? null : 'read-only-input'}></Input>
//           </Form.Item>
//
//           <Form.Item
//             label={<Text text="Password" />}
//             name="cluster_password"
//             className={enableEdit ? null : 'read-only-input'}>
//             <Input placeholder={enableEdit ? 'Cluster Password' : null} type="password" />
//           </Form.Item>
//
//           <NotifyField
//             enableEdit={enableEdit}
//             setNotifyStatus={setNotifyStatus}
//             setShowDetails={setShowDetails}
//             showDetails={showDetails}
//           />
//
//           {showDetails || enableEdit ? (
//             <>
//               {notifyStatus === 'Always' || notifyStatus === 'Only on success' ? (
//                 <Form.Item
//                   label={<Text text="Success" />}
//                   name="notificationSuccessMessage"
//                   className={enableEdit ? null : 'read-only-input'}
//                   rules={[
//                     {
//                       required: enableEdit ? true : false,
//                       message: 'Please enter success message',
//                     },
//                   ]}>
//                   <TextArea autoSize={{ minRows: enableEdit ? 2 : 1 }} placeholder={'Success message'} />
//                 </Form.Item>
//               ) : null}
//
//               {notifyStatus === 'Always' || notifyStatus === 'Only on failure' ? (
//                 <Form.Item
//                   label={<Text text="Failure" />}
//                   name="notificationFailureMessage"
//                   className={enableEdit ? null : 'read-only-input'}
//                   style={{ marginTop: '8px' }}
//                   rules={[
//                     {
//                       required: enableEdit ? true : false,
//                       message: 'Please enter a Failure',
//                     },
//                   ]}>
//                   <TextArea autoSize={{ minRows: enableEdit ? 2 : 1 }} placeholder={'Failure message'} />
//                 </Form.Item>
//               ) : null}
//
//               {notifyStatus !== 'Never' ? (
//                 <UserSearch
//                   enableEdit={enableEdit}
//                   layout={formLayout}
//                   showDetails={showDetails}
//                   noLabelLayout={noLabelLayout}
//                 />
//               ) : null}
//             </>
//           ) : null}
//         </Form>
//       </Modal>
//     </React.Fragment>
//   );
// }
//
// export default AddDataflow;
