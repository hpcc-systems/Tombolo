// /* eslint-disable react/no-unescaped-entities */
// import React, { useEffect, useState } from 'react';
// import { Form, Select, Space, Tag, Typography } from 'antd';

// import { CheckCircleOutlined } from '@ant-design/icons';

// const { Text } = Typography;

// const GHRepoSelect = ({ form, enableEdit, projects, setGhBrachOrTag }) => {
//   const [selectedProjects, setSelectedProjects] = useState([]);

//   useEffect(() => {
//     const projectIds = form.current?.getFieldValue(['gitHubFiles', 'selectedProjects']) || [];
//     const selectedRepoId = form?.current.getFieldValue(['gitHubFiles', 'selectedRepoId']);

//     if (projects.length > 0) {
//       const projectsArr = projects.filter((el) => projectIds.includes(el.id));
//       setSelectedProjects(projectsArr);
//       if (selectedRepoId) {
//         const selectedRepo = projectsArr.find((el) => el.id === selectedRepoId);

//         // THIS IS A READONLY VALUE THAT CAN BE CHANGED DYNAMICALLY ON GITHUB PROJECT LEVEL!
//         // IT IS PASSED TO GHMAINFILE TO BE SHOWN AS AN READONLY VALUE
//         setGhBrachOrTag(selectedRepo.ghBranchOrTag);

//         const updatedFields = {
//           gitHubFiles: {
//             reposList: [selectedRepo],
//           },
//         };
//         form.current.setFieldsValue(updatedFields);
//       }
//     }
//   }, [projects]);

//   const handleChange = (ghProjectsIdList) => {
//     const selectedProjects = projects.filter((project) => ghProjectsIdList.includes(project.id));

//     form.current.resetFields([
//       ['gitHubFiles', 'selectedRepoId'],
//       ['gitHubFiles', 'selectedFile'],
//       ['gitHubFiles', 'pathToFile'],
//       'name',
//       'title',
//     ]); // reset fields if repo is reselected

//     const restructured = selectedProjects.map((project) => {
//       const url = project.ghLink.split('/');
//       const owner = url[3];
//       const repo = url[4];
//       return { owner, repo, ...project };
//     });

//     const updatedFields = {
//       gitHubFiles: {
//         reposList: restructured,
//         reposFetched: true,
//       },
//     };

//     form.current.setFieldsValue(updatedFields);
//   };

//   return (
//     <Form.Item
//       label={<>GitHub Projects</>}
//       required={enableEdit}
//       name={['gitHubFiles', 'selectedProjects']}
//       // className={!enableEdit && 'read-only-input'}
//       help={enableEdit ? <Text type="warning">Adding or Removing projects will reset "Main File" fields</Text> : null}>
//       {enableEdit ? (
//         <Select mode="multiple" placeholder={'GitHub Projects'} onChange={handleChange} optionLabelProp="label">
//           {projects.map((project) => (
//             <Select.Option key={project.id} value={project.id} label={project.ghProject}>
//               <Tag color="geekblue">{project.ghBranchOrTag}</Tag> - {project.ghProject} - {project.ghLink}
//             </Select.Option>
//           ))}
//         </Select>
//       ) : (
//         <Space>
//           {selectedProjects.map((project) => {
//             const selectedProject = project.id === form.current?.getFieldValue(['gitHubFiles', 'selectedRepoId']);
//             return selectedProject ? (
//               <Tag key={project.id} icon={<CheckCircleOutlined />} color="success">
//                 {`${project.ghProject} - ${project.ghLink.replace('https://github.com/', '')}`}
//               </Tag>
//             ) : (
//               <Tag key={project.id} color={'geekblue'}>
//                 {`${project.ghProject} - ${project.ghLink.replace('https://github.com/', '')}`}
//               </Tag>
//             );
//           })}
//         </Space>
//       )}
//     </Form.Item>
//   );
// };

// export default GHRepoSelect;
