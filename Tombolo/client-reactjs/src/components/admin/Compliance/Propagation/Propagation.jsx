// import { Alert, Button, Modal } from 'antd';
// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useHistory } from 'react-router';
// import Text from '../../../common/Text';
// import ReportTable from '../ReportTable/ReportTable';
// import { generateChangesReport, getReports } from '@/redux/slices/PropagationSlice';

// const Propagation = () => {
//   const dispatch = useDispatch();
//   const { reports, changes } = useSelector((state) => state.propagation);

//   const baseLineReport = reports.find((report) => report.isBaseLine);

//   const [modal, setModal] = useState({ isOpen: false });

//   const history = useHistory();

//   const handlePropagate = () => {
//     if (baseLineReport) {
//       setModal({ isOpen: true });
//     } else {
//       dispatch(generateChangesReport({ history }));
//     }
//   };

//   const handleUseBaseLine = () => {
//     dispatch(generateChangesReport({ history, baseLineId: baseLineReport.id }));
//     setModal({ isOpen: false });
//   };

//   const handleUseCurrentState = () => {
//     dispatch(generateChangesReport({ history }));
//     setModal({ isOpen: false });
//   };

//   useEffect(() => {
//     if (reports.length === 0) {
//       dispatch(getReports({ callFrom: 'changes' }));
//     }
//   }, []);

//   return (
//     <>
//       <div style={{ maxWidth: '500px', marginBottom: '15px' }}>
//         {changes.error ? (
//           <Alert style={{ margin: '10px 0' }} closable type="error" showIcon message={changes.error} />
//         ) : null}

//         <Alert
//           message={<Text>Fields constraints propagation</Text>}
//           description={
//             <Text>
//               Constraints added to the input files fields will be passed to the output files fields. This process will
//               take some time.
//             </Text>
//           }
//           showIcon
//           action={
//             <Button block type="primary" loading={changes.loading} onClick={handlePropagate}>
//               <Text>Propagate</Text>
//             </Button>
//           }
//         />
//       </div>

//       <ReportTable type="changes" />

//       {!modal.isOpen ? null : (
//         <Modal
//           destroyOnClose
//           width={1000}
//           title={<Text>Would you like to compare against base line?</Text>}
//           onCancel={() => setModal({ isOpen: false })}
//           open={modal.isOpen}
//           footer={[
//             <Button key="current" type="secondary" onClick={handleUseCurrentState}>
//               <Text> Use Current State</Text>
//             </Button>,
//             <Button key="baseline" type="primary" onClick={handleUseBaseLine}>
//               <Text> Use Base Line</Text>
//             </Button>,
//           ]}>
//           <ReportTable data={[baseLineReport]} />
//         </Modal>
//       )}
//     </>
//   );
// };

// export default Propagation;
