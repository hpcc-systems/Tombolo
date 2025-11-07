// /* eslint-disable react/no-unescaped-entities */
// import React from 'react';
// import { CaretRightOutlined } from '@ant-design/icons';
// import { Collapse } from 'antd';
// const { Panel } = Collapse;
//
// function AssetsGuide() {
//   const panelStyle = {
//     marginBottom: 24,
//     border: 'none',
//   };
//
//   return (
//     <div>
//       <h2>Assets</h2>
//       <div>
//         The "Add Asset" feature in Tombolo allows you to import assets and their metadata from an HPCC cluster. You can
//         also add additional metadata to the imported asset and use it to create data flows. This version of Tombolo
//         enables you to import files, jobs, queries, and indexes. Additionally, you can create file templates and
//         generate Real-BI dashboards.
//       </div>
//       <Collapse
//         bordered={false}
//         defaultActiveKey={['1']}
//         style={{ marginTop: '25px' }}
//         expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
//         <Panel header="File" key="1" style={panelStyle}>
//           <p>
//             For files, you can search and import logical files into Tombolo using the auto-complete search field or the
//             file explorer. To use the auto-complete search, you must input at least three characters. You can view the
//             file layout and add permissible purposes and constraints if desired. If you have the correct permissions,
//             you can also preview the file inside Tombolo
//           </p>
//         </Panel>
//         <Panel header="Job" key="2" style={panelStyle}>
//           <p>
//             For jobs, you can search and import them using the auto-complete search feature. A minimum of three
//             characters is required to trigger a lookup. You can view the ECL associated with the job and its input and
//             output files. You can also import jobs from GitHub. To do so, you must first add the GitHub project. To
//             import jobs from GitHub, you must first add the GitHub project. You can access the UI to add a GitHub
//             project by clicking on the GitHub Projects link in the left navigation bar.
//           </p>
//         </Panel>
//         <Panel header="Index" key="3" style={panelStyle}>
//           <p>
//             For indexes, you can search and add them using the auto-complete search field. A minimum of three characters
//             is required to trigger the search. You can view the payload and workunit related to the imported indexes.
//           </p>
//         </Panel>
//         <Panel header="Query" key="4" style={panelStyle}>
//           <p>
//             For queries, you can search and add them using the auto-complete search field like any other assets. You can
//             view the input fields, output fields, and files related to the imported queries.
//           </p>
//         </Panel>
//         <Panel header="File Template" key="5" style={panelStyle}>
//           <p>
//             File templates can be created to group logical files. If a workflow has many files, and it is cluttering the
//             graph, file templates can be used to group files and tidy up the workspace. Additionally, file templates can
//             be used for monitoring files in landing zones and triggering workflows. For example, if you want to watch a
//             directory in a landing zone and trigger a workflow when a file with a particular file pattern is uploaded,
//             you can create a file template and add it to a dataflow to accomplish that.
//           </p>
//         </Panel>
//         <Panel header="Real-BI Dashboard" key="6" style={panelStyle}>
//           <p>
//             You can visualize logical file data by creating a Real-BI dashboard. To integrate this feature, the Real BI
//             URL must be added to the environment variable on the server.
//           </p>
//         </Panel>
//       </Collapse>
//     </div>
//   );
// }
//
// export default AssetsGuide;
