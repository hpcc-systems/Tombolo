// import { Form, Input, message, Modal } from 'antd';
// import React, { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { authHeader, handleError } from '../../../common/AuthHeader';
// import MonacoEditor from '../../../common/MonacoEditor';
// import Text from '../../../common/Text';

// const ConstraintForm = ({ modal, onClose }) => {
//   const constraints = useSelector((state) => state.application.constraints);
//   // const dispatch = useDispatch();

//   const [form] = Form.useForm();

//   const [sending, setSending] = useState({ loading: false, success: false, error: '' });

//   useEffect(() => {
//     if (modal.constraint) form.setFieldsValue(modal.constraint);

//     return () => form.resetFields();
//   }, [modal.isOpen]);

//   const getOKtext = () => (modal.constraint ? 'Edit' : 'Add');

//   const handleOk = async () => {
//     try {
//       const fields = await form.validateFields();
//       // modal.constraint ? await onEdit({ ...modal.constraint, ...fields }) : await onCreate(fields);
//       await sendConstaint(fields);
//     } catch (error) {
//       console.log('error', error);
//       message.error('Please check your inputs');
//     }
//   };

//   const sendConstaint = async (fields) => {
//     const constraint = modal.constraint ? { ...modal.constraint, ...fields } : fields;
//     const isEditing = !!modal.constraint;

//     try {
//       const config = {
//         method: 'POST',
//         headers: authHeader(),
//         body: JSON.stringify(constraint),
//       };

//       setSending((prev) => ({ ...prev, loading: true, error: '', success: false }));

//       const response = await fetch('/api/constraint', config);
//       if (!response.ok) handleError(response);

//       setSending((prev) => ({ ...prev, loading: false, success: true }));
//       const data = await response.json();

//       // eslint-disable-next-line unused-imports/no-unused-vars
//       const newConstraints = isEditing
//         ? constraints.map((el) => (el.id == data.id ? data : el))
//         : [data, ...constraints];

//       // dispatch(updateConstraints(newConstraints));

//       message.success('Success');
//       onClose();
//     } catch (error) {
//       setSending((prev) => ({ ...prev, loading: false, success: false, error: error.message }));
//       console.log('Error fetch', error);
//       message.error(error.message);
//     }
//   };

//   if (!modal.isOpen) return null;

//   return (
//     <Modal
//       destroyOnClose
//       onOk={handleOk}
//       onCancel={onClose}
//       okText={getOKtext()}
//       open={modal.isOpen}
//       confirmLoading={sending.loading}>
//       <Form layout="vertical" form={form}>
//         <Form.Item
//           label={<Text>Constraint name</Text>}
//           name="name"
//           validateTrigger={['onChange', 'onBlur']}
//           rules={[
//             {
//               max: 256,
//               message: 'Maximum of 256 characters allowed',
//             },
//           ]}
//           required>
//           <Input />
//         </Form.Item>
//         <Form.Item
//           label={<Text>Short Description</Text>}
//           validateTrigger={['onChange', 'onBlur']}
//           rules={[
//             {
//               max: 256,
//               message: 'Maximum of 256 characters allowed',
//             },
//           ]}
//           name="short_description">
//           <Input />
//         </Form.Item>
//         <Form.Item
//           label={<Text>Description</Text>}
//           validateTrigger={['onChange', 'onBlur']}
//           rules={[
//             {
//               max: 1024,
//               message: 'Maximum of 1024 characters allowed',
//             },
//           ]}
//           name="description">
//           <MonacoEditor lang="markdown" targetDomId="constarint" />
//         </Form.Item>
//       </Form>
//     </Modal>
//   );
// };

// export default ConstraintForm;
