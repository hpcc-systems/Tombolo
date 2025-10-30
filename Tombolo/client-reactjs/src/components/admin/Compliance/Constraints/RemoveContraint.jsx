// import { DeleteOutlined } from '@ant-design/icons';
// import React from 'react';
// import { useSelector } from 'react-redux';
// import { authHeader, handleError } from '../../../common/AuthHeader';
// import ConfirmAction from '../../../common/ConfirmAction';
// import Text from '../../../common/Text';

// const RemoveContraint = ({ record }) => {
//   const constraints = useSelector((state) => state.application.constraints);
//   // const dispatch = useDispatch();

//   const remove = async () => {
//     const config = { method: 'DELETE', headers: authHeader() };
//     // const response = await fetch(`/api/constraint/${record.id}`, config);
//     if (!response.ok) handleError(response);
//     const data = await response.json();

//     if (!data.success || !data.id) throw new Error('Failed to remove constraint');

//     // eslint-disable-next-line unused-imports/no-unused-vars
//     const newConstraints = constraints.filter((el) => el.id !== data.id);
//     // TODO: This doesn't exist (updateConstraints)
//     // dispatch(updateConstraints(newConstraints));
//   };

//   return (
//     <ConfirmAction
//       onConfirm={remove}
//       icon={<DeleteOutlined />}
//       tooltip={<Text>Remove constraint</Text>}
//       notification={{ success: 'Constraint removed successfully' }}
//       confirm={{ title: 'Are you sure you want to delete constraint permanently?' }}
//     />
//   );
// };

// export default RemoveContraint;
