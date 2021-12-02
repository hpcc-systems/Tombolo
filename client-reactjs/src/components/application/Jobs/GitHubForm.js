/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Select, Cascader, Input, Row, Col } from "antd";
import Search from "antd/lib/input/Search";
import Form from "antd/lib/form/Form";
import { UserOutlined, LockOutlined } from '@ant-design/icons';

function GitHubForm({ form ,enableEdit }) { 
  
  const [branchesRequest, setBranchesRequest] = useState({ validateStatus: null, selectedBranch: null, loading: false, branches: null, error: null, owner: null, repo: null, });

  const [repoTree, setRepoTree] = useState([]);
  
  const [defaultCascader, setDefaultCascader] = useState(null);

  const getAuthorizationHeaders = () =>{
  // const gitHubUserName = form?.current.getFieldValue([ "gitHubFiles", "gitHubUserName", ]);
  const gitHubUserAccessToken = form?.current.getFieldValue([ "gitHubFiles", "gitHubUserAccessToken", ]);   
  const headers ={ 'Accept': 'application/json', 'Content-Type': 'application/json' };
  if (gitHubUserAccessToken) headers.Authorization = `token ${gitHubUserAccessToken}`;
  return headers;
}

  const onSearch = async (value, event) => {
    const url = value.split("/");
    const owner = url[3];
    const repo = url[4];
    try {
    if(!owner || !repo || !value.startsWith('https://github.com/')) throw new Error("Invalid repo provided.")
    setBranchesRequest((prev) => ({ ...prev, loading: true }));
      const respond = await fetch( `https://api.github.com/repos/${owner}/${repo}/branches`,{headers: getAuthorizationHeaders()} );
      const branches = await respond.json();      
      if (branches.message) throw new Error(branches.message);
      setBranchesRequest((prev) => ({ ...prev, repo, owner, error: null, loading: false, validateStatus: "success", branches: branches, }));
    } catch (error) {
      console.log(`error`, error);
      setBranchesRequest({ loading: false, validateStatus: "error", error: error.message, });
    }
    form.current.resetFields([["gitHubFiles", "selectedGitBranch"],["gitHubFiles", "pathToFile"],["gitHubFiles", "selectedFile"]])
  };

  const handleBranchSelect = (value) => {
    const selectedBranch = branchesRequest.branches.find( (branch) => branch.name === value );
    setBranchesRequest((prev) => ({ ...prev, selectedBranch }));
  };

  const onChange = (value, selectedOptions) => {
    // console.log(`value`, value); console.log(`selectedFile`, selectedOptions[selectedOptions.length - 1]); console.log("selectedRepo", selectedOptions[selectedOptions.length - 2]); // this object has children prop with all files currently in repo, can be stale info if saved to db
      if (value.length === 0) {
        form.current.setFieldsValue({ gitHubFiles: { selectedFile: null } }); // this is triggered when user resets cascader
      }
      if (selectedOptions[selectedOptions.length - 1]?.isLeaf) {
        form.current.setFieldsValue({
           gitHubFiles: { selectedFile: { ...selectedOptions[selectedOptions.length - 1], projectOwner: branchesRequest.owner, projectName: branchesRequest.repo }, },
           name: value[value.length -1],
           title: value[value.length -1],
        });
      }
    };

  const fetchFilesFromBranch = async (targetOption) =>{
      const respond = await fetch( `https://api.github.com/repos/${branchesRequest.owner}/${ branchesRequest.repo }/contents${targetOption.path ? "/" + targetOption.path : ""}?ref=${ branchesRequest.selectedBranch.name }` );    
      const content = await respond.json();
      if (content.message) throw new Error(content.message);
      return content
  }

  const loadBranchTree = async (selectedOptions) => {
    try {
    const targetOption = selectedOptions[selectedOptions.length - 1];
      targetOption.loading = true;
      const content = await fetchFilesFromBranch(targetOption);
      targetOption.loading = false;
      targetOption.children = content.map((el) => ({
        ...el,
        value: el.name,
        label: el.name,
        isLeaf: el.type === "dir" ? false : true,
      }));
      setRepoTree([...repoTree]);
    } catch (error) {
      console.log(`error`, error);
      form.current.setFields([{name:["gitHubFiles", "pathToFile"], errors:[error.message]}]);
    }
  };

  useEffect(() => {
    if (branchesRequest.selectedBranch?.name) {
      (async()=>{
        try{
          const content = await fetchFilesFromBranch({path:null});         
          const initialTree = content.map((el) => ({ ...el, value: el.name, label: el.name, isLeaf: el.type === "dir" ? false : true, }));
          setRepoTree(initialTree);
        } catch (error){
          form.current.setFields([{name:["gitHubFiles", "pathToFile"], errors:[error.message]}]);
        }
      })()
    }
}, [branchesRequest.selectedBranch?.name]);

  useEffect(() => {
    const defaultCascader = form?.current.getFieldValue([ "gitHubFiles", "pathToFile", ]);
    
    if (defaultCascader?.length > 1) {
      const createOptionsTree = ( defaultCascader, currentNode = {}, repoTree = {} ) => {
        const [currentValue, ...rest] = defaultCascader;

        const currentObject = { value: currentValue, label: currentValue, children: [] };

        if (!repoTree.children) {
          repoTree = currentObject;
          return createOptionsTree(rest, repoTree, repoTree);
        } else {
          currentNode.children.push(currentObject);
          if (defaultCascader.length === 1) {
            delete currentObject.children;
            return repoTree;
          }
          return createOptionsTree(rest, currentObject, repoTree);
        }
      };

      const defaultOptions = createOptionsTree(defaultCascader);
      setDefaultCascader(defaultCascader);
      setRepoTree([defaultOptions]);
    }
  }, []);

  return (
    <>
      <Form.Item 
      label="Credentials"  
      help="GitHub credentials are not required for public repos, although they are usually autofilled by your browser, please check inputs."
      >
       <Row gutter={[8, 8]}>
        <Col span={12}>
          <Form.Item 
             name={["gitHubFiles", "gitHubUserName"]}
             validateTrigger={["onBlur", "onSubmit"]}
             className={!enableEdit && "read-only-input"}
             rules={[
              ({ getFieldValue, setFields }) => ({
                validator: (field, value) => {
                  const token = getFieldValue(["gitHubFiles", "gitHubUserAccessToken"])
                  if (!value && token) {
                    return Promise.reject(new Error("Provide Github Username"));
                  }
                  if (!value && !token){
                    setFields([{name:["gitHubFiles", "gitHubUserName"],errors:[]}, {name:["gitHubFiles", "gitHubUserAccessToken"],errors:[]}])
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input autoComplete="new-password" allowClear prefix={<UserOutlined className="site-form-item-icon" />} placeholder="GitHub User Name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
           name={["gitHubFiles", "gitHubUserAccessToken"]}
           className={!enableEdit && "read-only-input"}
           validateTrigger={["onBlur", "onSubmit"]}
           rules={[      
            ({ getFieldValue,setFields }) => ({
              validator: (field, value) => {
                const gitHubUserName = getFieldValue(["gitHubFiles", "gitHubUserName"]);
                if (!value && gitHubUserName) {
                  return Promise.reject(new Error("Provide Github Access Token"));
                }
                if (!value && !gitHubUserName){
                  setFields([{name:["gitHubFiles", "gitHubUserName"],errors:[]}, {name:["gitHubFiles", "gitHubUserAccessToken"],errors:[]}])
                }
                return Promise.resolve();
              },
            }),
          ]}
          >
            <Input autoComplete="new-password" allowClear prefix={<LockOutlined className="site-form-item-icon" />} type="password" placeholder="Private Access Token" />
          </Form.Item>
        </Col>
       </Row>
      </Form.Item>

      <Form.Item
        label="GitHub repo"
        validateTrigger={["onBlur"]}
        name={["gitHubFiles", "providedGithubRepo"]}
        className={!enableEdit && "read-only-input"}
        validateStatus={branchesRequest.validateStatus}
        rules={[ { required: true, message: "Provide valid Github repo" }, { type: "url", message: "Invalid URL" }, ]}
        help={
          branchesRequest.error ? (
            branchesRequest.error
          ) : branchesRequest.validateStatus === "success" ? (
            <span style={{ color: "green" }}>
              Success! Choose the branch you want to browse
            </span>
          ) : null
        }
      >
        <Search
          onSearch={onSearch}
          loading={branchesRequest.loading}
          enterButton={enableEdit ? true : false}
          placeholder="Provide a link to GitHub repo"
        />
      </Form.Item>

      <Form.Item
        label="Branch"
        validateTrigger={["onBlur"]}
        name={["gitHubFiles", "selectedGitBranch"]}
        className={!enableEdit && "read-only-input"}
        rules={[
          {
            required: true,
            message: "Select branch",
          },
        ]}
      >
        <Select
          placeholder="Select branch"
          disabled={enableEdit && !branchesRequest.branches}
          onChange={handleBranchSelect}
        >
          {branchesRequest.branches?.map((branch) => (
            <Select.Option key={branch.name} value={branch.name}>
              {branch.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Main File"
        validateTrigger={["onBlur"]}
        name={["gitHubFiles", "pathToFile"]}
        rules={[
          { required: true, message: "" },
          ({ getFieldValue }) => ({
            validator(field, value) {
              if (getFieldValue(["gitHubFiles", "selectedFile"])) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Select a start file"));
            },
          }),
        ]}
      >
        <Cascader
          defaultValue={defaultCascader}
          className={!enableEdit && "read-only-input"}
          disabled={!branchesRequest.selectedBranch}
          changeOnSelect
          options={repoTree}
          onChange={onChange}
          loadData={loadBranchTree}
        />
      </Form.Item>
      <Form.Item hidden={true} name={["gitHubFiles", "selectedFile"]} /> 
    </>
  );
}

export default GitHubForm;

