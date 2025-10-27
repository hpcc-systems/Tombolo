// import React, { useEffect, useState } from 'react';
// import { Form, Select, Cascader, Input, Tag, Space } from 'antd';
// import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';

// import Text from '../../../common/Text';

// function GHMainFile({ enableEdit, form, branchOrTagName }) {
//   const [repoTree, setRepoTree] = useState([]);

//   const fetchFilesFromGitHub = async (targetOption) => {
//     const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
//     if (targetOption.ghToken) headers.Authorization = `token ${targetOption.ghToken}`;

//     const url = `https://api.github.com/repos/${targetOption.owner}/${targetOption.repo}/contents${
//       targetOption.path ? '/' + targetOption.path : ''
//     }?ref=${targetOption.ref}`;
//     const respond = await fetch(url, { headers });

//     const content = await respond.json();
//     if (content.message) throw new Error(content.message);

//     return content;
//   };

//   const onChange = async (value, selectedOptions) => {
//     if (!value) return form.current.resetFields([['gitHubFiles', 'selectedFile'], 'name', 'title']); // this is triggered when user resets cascader

//     if (selectedOptions[selectedOptions.length - 1]?.isLeaf) {
//       const updateFields = {
//         gitHubFiles: { selectedFile: { ...selectedOptions[selectedOptions.length - 1] } },
//         name: value[value.length - 1],
//         title: value[value.length - 1],
//       };
//       form.current.setFieldsValue(updateFields);
//       try {
//         await form.current.validateFields([['gitHubFiles', 'pathToFile']]);
//       } catch (error) {
//         console.log('-error-----------------------------------------');
//         console.dir({ error }, { depth: null });
//         console.log('------------------------------------------');
//       }
//     }
//   };

//   const loadBranchTree = async (selectedOptions) => {
//     form.current.setFields([{ name: ['gitHubFiles', 'pathToFile'], errors: [] }]); // reset errors if loading new tree
//     try {
//       const targetOption = selectedOptions[selectedOptions.length - 1];
//       targetOption.loading = true;
//       const content = await fetchFilesFromGitHub(targetOption);
//       targetOption.loading = false;
//       targetOption.children = content.map((el) => ({
//         ...el,
//         value: el.name,
//         label: el.name,
//         isLeaf: el.type === 'dir' ? false : true,
//         ref: targetOption.ref,
//         repo: targetOption.repo,
//         owner: targetOption.owner,
//         ghToken: targetOption.ghToken,
//         id: targetOption.id,
//       }));
//       setRepoTree([...repoTree]);
//     } catch (error) {
//       console.log('error', error);
//       form.current.setFields([{ name: ['gitHubFiles', 'pathToFile'], errors: [error.message] }]);
//     }
//   };

//   const handleSelectRepo = async (selectedRepoId) => {
//     form.current.resetFields([['gitHubFiles', 'selectedFile'], ['gitHubFiles', 'pathToFile'], 'name', 'title']); // reset fields if repo is reselected

//     if (selectedRepoId === undefined) return; // exit function if user hit reset button.

//     const selectedRepo = form.current
//       ?.getFieldValue(['gitHubFiles', 'reposList'])
//       ?.find((el) => el.id === selectedRepoId);
//     const tagOrBranch = selectedRepo.ghBranchOrTag;

//     try {
//       const content = await fetchFilesFromGitHub({
//         path: null,
//         ref: tagOrBranch,
//         repo: selectedRepo.repo,
//         owner: selectedRepo.owner,
//         ghToken: selectedRepo.ghToken,
//       });

//       const initialTree = content.map((el) => ({
//         ...el,
//         value: el.name,
//         label: el.name,
//         isLeaf: el.type === 'dir' ? false : true,
//         ref: tagOrBranch,
//         repo: selectedRepo.repo,
//         owner: selectedRepo.owner,
//         ghToken: selectedRepo.ghToken,
//         id: selectedRepo.id,
//       }));

//       setRepoTree(initialTree);
//     } catch (error) {
//       form.current.setFields([{ name: ['gitHubFiles', 'selectedRepoId'], errors: [error.message] }]);
//     }
//   };

//   const repoList = form.current?.getFieldValue(['gitHubFiles', 'reposList']) || [];
//   const reposFetched = form.current?.getFieldValue(['gitHubFiles', 'reposFetched']);
//   const selectedRepoId = form.current?.getFieldValue(['gitHubFiles', 'selectedRepoId']) || '';
//   const pathToFile = form.current?.getFieldValue(['gitHubFiles', 'pathToFile']) || [];

//   return (
//     <Form.Item
//       label={enableEdit ? <Text>Main File</Text> : <Text>Branch and File</Text>}
//       required={enableEdit}
//       className={!enableEdit && 'read-only-input'}>
//       {enableEdit ? (
//         <Input.Group compact>
//           <Form.Item
//             noStyle
//             name={['gitHubFiles', 'selectedRepoId']}
//             validateTrigger={['onBlur', 'onSubmit']}
//             rules={[{ required: true, message: 'Please select main file repo' }]}>
//             <Select
//               allowClear
//               style={{ width: '50%' }}
//               onChange={handleSelectRepo}
//               disabled={!reposFetched}
//               placeholder={'Select Main File Repo'}
//               popupMatchSelectWidth={false}>
//               {repoList.map((repo) => (
//                 <Select.Option key={repo.id} value={repo.id}>
//                   <Tag color="geekblue">{repo.ghBranchOrTag}</Tag> - {repo.ghProject} -{' '}
//                   {repo.ghLink.replace('https://github.com/', '')}
//                 </Select.Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item
//             noStyle
//             name={['gitHubFiles', 'pathToFile']}
//             validateTrigger={['onBlur', 'onSubmit']}
//             rules={[
//               { required: true, message: '' },
//               ({ getFieldValue }) => ({
//                 validator(_field, _value) {
//                   if (getFieldValue(['gitHubFiles', 'selectedFile'])) return Promise.resolve();
//                   return Promise.reject(new Error('Please select a main file'));
//                 },
//               }),
//             ]}>
//             <Cascader
//               style={{ width: '50%' }}
//               changeOnSelect
//               options={repoTree}
//               onChange={onChange}
//               loadData={loadBranchTree}
//               placeholder={'Select Main File'}
//               className={!enableEdit && 'read-only-input'}
//               disabled={selectedRepoId === undefined || repoTree.length === 0}
//             />
//           </Form.Item>
//         </Input.Group>
//       ) : (
//         <Space>
//           <Tag color="cyan"> {branchOrTagName} </Tag>
//           <Tag color="magenta"> {pathToFile.join('/')} </Tag>
//           <FileStatus form={form} enableEdit={enableEdit} branchOrTagName={branchOrTagName} />
//         </Space>
//       )}
//     </Form.Item>
//   );
// }

// export default GHMainFile;

// const FileStatus = ({ form, enableEdit, branchOrTagName }) => {
//   const [fileExist, setFileExist] = useState({ loading: false, status: null });

//   useEffect(() => {
//     const selectedRepoId = form.current?.getFieldValue(['gitHubFiles', 'selectedRepoId']) || '';
//     const selectedFile = form.current?.getFieldValue(['gitHubFiles', 'selectedFile']);
//     const selectedRepo = form.current
//       ?.getFieldValue(['gitHubFiles', 'reposList'])
//       ?.find((el) => el.id === selectedRepoId);

//     if (!enableEdit && branchOrTagName && selectedFile && selectedRepo) {
//       (async () => {
//         try {
//           const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
//           if (selectedRepo.ghToken) headers.Authorization = `token ${selectedRepo.ghToken}`;
//           setFileExist(() => ({ loading: true, result: null }));
//           const url = `https://api.github.com/repos/${selectedFile.owner}/${selectedFile.repo}/contents/${selectedFile.path}?ref=${branchOrTagName}`;
//           const respond = await fetch(url, { headers });
//           const content = await respond.json();
//           if (content.message) throw new Error(content.message);
//           setFileExist(() => ({ loading: false, status: 'ok' }));
//         } catch (error) {
//           setFileExist(() => ({ loading: false, status: error.message }));
//         }
//       })();
//     }
//   }, [branchOrTagName, enableEdit]);

//   const getStatus = () => {
//     if (!fileExist.status) return null;
//     if (fileExist.status === 'ok') {
//       return (
//         <>
//           <CheckCircleOutlined style={{ color: 'green' }} /> file exists{' '}
//         </>
//       );
//     } else {
//       return (
//         <>
//           <CloseCircleOutlined style={{ color: 'red' }} />
//           file was not found, please check your credentials
//         </>
//       );
//     }
//   };

//   return (
//     <>
//       {fileExist.loading && (
//         <>
//           <LoadingOutlined /> ...checking file
//         </>
//       )}
//       {getStatus()}
//     </>
//   );
// };
