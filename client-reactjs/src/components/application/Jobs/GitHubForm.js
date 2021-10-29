/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Select, Cascader } from "antd";
import Search from "antd/lib/input/Search";
import Form from "antd/lib/form/Form";

function GitHubForm({ form }) {
  const [branchesRequest, setBranchesRequest] = useState({
    validateStatus: null,
    selectedBranch: null,
    loading: false,
    branches: null,
    error: null,
    owner: null,
    repo: null,
  });

  const [repoTree, setRepoTree] = useState([
    { value: "/", label: "root", isLeaf: false },
  ]);

  const onSearch = async (value, event) => {
    console.log(`value`, value);
    const url = value.split("/");
    const owner = url[3];
    const repo = url[4];
    setBranchesRequest((prev) => ({ ...prev, loading: true }));
    try {
      const respond = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/branches`
      );
      const branches = await respond.json();
      if (branches.message) throw new Error(branches.message);
      console.log(`branches`, branches);
      setBranchesRequest((prev) => ({
        ...prev,
        repo,
        owner,
        error: null,
        loading: false,
        validateStatus: "success",
        branches: branches,
      }));
    } catch (error) {
      console.log(`error`, error);
      setBranchesRequest({
        loading: false,
        validateStatus: "error",
        error: error.message,
      });
    }
  };

  const handleBranchSelect = async (value) => {
    const selectedBranch = branchesRequest.branches.find(
      (branch) => branch.name === value
    );
    setBranchesRequest((prev) => ({ ...prev, selectedBranch }));
  };

  const onChange = (value, selectedOptions) => {
    console.log(`value`, value);
    console.log(`form.current`, form.current);
    console.log(`selectedFile`, selectedOptions[selectedOptions.length - 1]);
    console.log("selectedRepo", selectedOptions[selectedOptions.length - 2]); // this object has children prop with all files currently in repo, can be stale info if saved to db
    if (value.length === 0) {
      form.current.setFieldsValue({ filesFromGithub: { selectedFile: null } }); // this is triggered when user resets cascader
    }
    if (selectedOptions[selectedOptions.length - 1]?.isLeaf) {
      form.current.setFieldsValue({
        filesFromGithub: {
          selectedFile: selectedOptions[selectedOptions.length - 1],
        },
        // file is selected when isLeaf prop on selected obj is true. if its false, means user in selected 'dir'
      });
    }
  };

  const loadBranchTree = async (selectedOptions) => {
    console.log(`selectedOptions`, selectedOptions);
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;
    console.log(`targetOption`, targetOption);
    try {
      const respond = await fetch(
        `https://api.github.com/repos/${branchesRequest.owner}/${
          branchesRequest.repo
        }/contents${targetOption.path ? "/" + targetOption.path : ""}?ref=${
          branchesRequest.selectedBranch.name
        }`
      );
      const content = await respond.json();
      targetOption.loading = false;
      if (content.message) throw new Error(content.message);
      targetOption.children = content.map((el) => ({
        ...el,
        value: el.name,
        label: el.name,
        isLeaf: el.type === "dir" ? false : true,
      }));
      setRepoTree([...repoTree]);
    } catch (error) {
      console.log(`error`, error);
    }
  };

  useEffect(() => {
    if (branchesRequest.selectedBranch?.name) {
      loadBranchTree(repoTree); // start loading files from root of the project.
    }
  }, [branchesRequest.selectedBranch?.name]);

  console.log(
    `this.formRef.current.getFieldsValue()`,
    form.current?.getFieldsValue()
  );
  console.log(`form.current`, form.current);
  return (
    <>
      <Form.Item
        label="GitHub repo"
        name={["filesFromGithub", "providedGithubRepo"]}
        validateTrigger={["onBlur"]}
        rules={[
          { required: true, message: "Provide valid Github repo" },
          { type: "url", message: "Invalid URL" },
        ]}
        validateStatus={branchesRequest.validateStatus}
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
          placeholder="Provide a link to GitHub repo"
          onSearch={onSearch}
          loading={branchesRequest.loading}
          enterButton
        />
      </Form.Item>

      <Form.Item
        label="Select branch"
        validateTrigger={["onBlur"]}
        name={["filesFromGithub", "selectedGitBranch"]}
        rules={[
          {
            required: true,
            message: "Select branch",
          },
        ]}
      >
        <Select placeholder="Select branch" onChange={handleBranchSelect}>
          {branchesRequest.branches?.map((branch) => (
            <Select.Option key={branch.name} value={branch.name}>
              {branch.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Select Start File"
        validateTrigger={["onBlur"]}
        name={["filesFromGithub", "pathToFile"]}
        rules={[
          { required: true, message: "" },
          ({ getFieldValue }) => ({
            validator(field, value) {
              if (getFieldValue(["filesFromGithub", "selectedFile"])) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Select a start file"));
            },
          }),
        ]}
      >
        <Cascader
          disabled={!repoTree[0].children}
          changeOnSelect
          options={repoTree}
          onChange={onChange}
          loadData={loadBranchTree}
        />
      </Form.Item>

      <Form.Item hidden={true} name={["filesFromGithub", "selectedFile"]} />
    </>
  );
}

export default GitHubForm;

// const formItemLayout = {
//   labelCol: { span: 3 },
//   wrapperCol: { span: 7 },
// };

//  <Form.Item {...formItemLayout} label="GitHub email" name="gitHubUserName">
//       <Input />
//     </Form.Item>
//     <Form.Item
//       {...formItemLayout}
//       label="GitHub Password"
//       name="gitHubPassword"
//     >
//       <Input.Password />
//     </Form.Item>
