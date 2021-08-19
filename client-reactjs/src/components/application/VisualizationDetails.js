import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { hasEditPermission } from "../common/AuthUtil.js";
import ReactMarkdown from "react-markdown";
import { MarkdownEditor } from "../common/MarkdownEditor.js";
import {
  Row,
  Col,
  Button,
  Form,
  Input,
  Select,
  Tabs,
  Spin,
  AutoComplete,
  message,
  Radio
} from "antd/lib";
import { authHeader, handleError } from "../common/AuthHeader.js";
import {editableMode} from "../common/readOnlyUtil";
import { assetsActions } from "../../redux/actions/Assets";
import { debounce } from "lodash";
import { useHistory } from "react-router";

const TabPane = Tabs.TabPane;
const Option = Select.Option;
const formItemLayout = {
  labelCol: { span: 2 },
  wrapperCol: { span: 8 },
};


function VisualizationDetails({ selectedGroup, openGroup, handleEditGroup, refreshGroups }) {
  const [formState, setFormState] = useState({
    initialDataLoading: false,
    fileSearchSuggestions: [],
    enableEdit: true,
    editing: true,
    dataAltered: false,    
    fileSearchErrorShown: false,
    selectedFileId: ''
  });
  const [visualization, setVisualization] = useState({
    id: '',
    chartType: "table",
    url: '',
    title: '',
    name: '',
    description: '',
    selectedCluster: '',
  });  
  
  const authReducer = useSelector((state) => state.authenticationReducer);
  const assetReducer = useSelector((state) => state.assetReducer);
  const viewOnlyModeReducer = useSelector((state) => state.viewOnlyModeReducer);
  const applicationReducer = useSelector((state) => state.applicationReducer);
  const editingAllowed = hasEditPermission(authReducer.user);
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    getVisualizationDetails();
  }, [assetReducer.selectedAsset]);

  const makeFieldsEditable = () => {
    editableMode();

    setFormState({
      ...formState,
      enableEdit: true,
      editing: true
    })
  };

  const switchToViewOnly = () => {
    setFormState({
      ...formState,
      enableEdit: false,
      editing: false,
      dataAltered: true
    })
  }

  // view edit buttons on tabpane
  const editButton =
  !formState.enableEdit && editingAllowed ? (
    <>
      <Button type="primary" onClick={makeFieldsEditable}>
        Edit
      </Button>
    </>
  ) : null;

  const viewChangesBtn = formState.editing ? (
    <Button onClick={switchToViewOnly} type="primary" ghost>
      View Changes
    </Button>
  ) : null;

  const editandViewBtns = (
    <div>
      {editButton} {viewChangesBtn}
    </div>
  );

  const handleOk = async (e) => {
    e.preventDefault();
    setFormState({
      ...formState,
      confirmLoading: true
    })

    try {
      const values = await form.current.validateFields();
      console.log(formState.selectedCluster)
      fetch("/api/file/read/visualization", {
        method: "post",
        headers: authHeader(),
        body: JSON.stringify({
          id: formState.selectedFileId,
          application_id: applicationReducer.application.applicationId,
          email: authReducer.user.email,
          clusterId: formState.selectedCluster,
          fileName: form.current.getFieldValue("name"),
          groupId: assetReducer.newAsset.groupId ? assetReducer.newAsset.groupId : "",
          description: form.current.getFieldValue("description"),
          editingAllowed: editingAllowed
        }),
      })
      .then(function (response) {
        if (response.ok && response.status == 200) {
          return response.json();
        }
        handleError(response);
      })      
      .then(function (data) {
        if (data && data.success) {
          setFormState({
            ...formState,
            confirmLoading: false,
          });

          history.push("/" + applicationReducer.application.applicationId + "/assets");
        }
      })
    } catch(err) {
      console.log(err);
    }
  }

  const handleCancel = () => {

  }

  const getVisualizationDetails = () => {
    if(assetReducer.selectedAsset && assetReducer.selectedAsset.id != '') {
      setFormState({
        ...formState,
        initialDataLoading: true
      })
      
      fetch("/api/file/read/getVisualizationDetails?id="+assetReducer.selectedAsset.id,{
        headers: authHeader(),
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        setFormState({
          ...formState,
          initialDataLoading: false
        })
        setVisualization({
          id: data.id,
          chartType: "table",
          url: data.url,
          name: data.name,
          description: data.description,
          clusterId: data.clusterId

        })
        form.current.setFieldsValue({
          chartType: "table",
          url: data.url,
          name: data.name,
          description: data.description      
        })
      })
    }
  }  

  const onChange = (e) => {
    setFormState({
      ...formState,
      dataAltered: true
    })      
  }
    
  const onClusterSelection = (value) => {
    dispatch(assetsActions.clusterSelected(value));
    setFormState({
      ...formState,
      selectedCluster: value
    })
  }

  const clearState = () => {
    setFormState({
      initialDataLoading: false,
      fileSearchSuggestions: [],
      enableEdit: false,
      editing: false,
      dataAltered: false,
      selectedCluster: ''
    })
  }

  const searchFiles = debounce((searchString) => {
    if (searchString.length <= 3 || formState.fileSearchErrorShown) return;
    if (!searchString.match(/^[a-zA-Z0-9_ -]*$/)) {
      message.error(
        "Invalid search keyword. Please remove any special characters from the keyword."
      );      
      return;
    }
    setFormState({
      ...formState,
      fileSearchErrorShown: false
    })

    var data = JSON.stringify({
      app_id: applicationReducer.application.applicationId,
      keyword: searchString,
    });
    fetch("/api/file/read/tomboloFileSearch", {
      method: "post",
      headers: authHeader(),
      body: data,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw response;
      }
    })
    .then((suggestions) => {
      setFormState({
        ...formState,
        fileSearchSuggestions: suggestions
      })        
    })
    .catch((error) => {
      console.log(formState.fileSearchErrorShown);
      if (!formState.fileSearchErrorShown) {
        error.json().then((body) => {
          message.error(
            "There was an error searching the files from cluster."
          );
        });
        setFormState({
          ...formState,
          fileSearchErrorShown: true
        });
      }
    });
  }, 100);

  const onFileSelected = (selectedSuggestion) => {
    fetch("/api/hpcc/read/getFileInfo?fileName="+selectedSuggestion+"&applicationId="+applicationReducer.application.applicationId,{
        headers: authHeader(),
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then((fileInfo) => {
      setFormState({
        ...formState,
        selectedFileId: fileInfo.basic.id
      })                
      form.current.setFieldsValue({
        name: fileInfo.basic.name
      });
      return fileInfo;
    })
    .catch((error) => {
      console.log(error);
      message.error(
        "There was an error getting file information from the cluster. Please try again"
      );
    });
  }

  return (
    <React.Fragment>
        {viewOnlyModeReducer.addingNewAsset ? null : (
          <div
            style={{
              padding: "5px 16px",
              background: "var(--light)",
              fontWeight: "600",
              margin: "0px -16px",
            }}
          >
            File : {visualization.name}
          </div>
        )}
        <div className={"assetDetails-content-wrapper"}>
          {!assetReducer.newAsset.isNew ? (
            <div className="loader">
              <Spin spinning={formState.initialDataLoading} size="large" />
            </div>
          ) : null}
          <Tabs defaultActiveKey="1" tabBarExtraContent={editandViewBtns}>
            <TabPane tab="Basic" key="1">
              <Form
                {...formItemLayout}
                labelAlign="left"
                ref={form}
                onFinish={handleOk}
              >
                {viewOnlyModeReducer.editMode ? (
                  <div>
                    {viewOnlyModeReducer.addingNewAsset ? (
                      <React.Fragment>                        
                        <Form.Item label="File" name="fileSearchValue">
                          <Row type="flex">
                            <Col span={21} order={1}>
                              <AutoComplete
                                className="certain-category-search"
                                dropdownClassName="certain-category-search-dropdown"
                                dropdownMatchSelectWidth={false}
                                dropdownStyle={{ width: 300 }}
                                style={{ width: "100%" }}
                                onSearch={(value) =>
                                  searchFiles(value)
                                }
                                onSelect={(value) =>
                                  onFileSelected(value)
                                }
                                placeholder="Search files"
                                disabled={!editingAllowed}
                                onChange={onChange}
                                notFoundContent={
                                  formState.fileSearchSuggestions.length >
                                  0 ? (
                                    "Not Found"
                                  ) : (
                                    <Spin />
                                  )
                                }
                              >
                                {formState.fileSearchSuggestions.map(
                                  (suggestion) => (
                                    <Option
                                      key={suggestion.text}
                                      value={suggestion.value}
                                    >
                                      {suggestion.text}
                                    </Option>
                                  )
                                )}
                              </AutoComplete>
                            </Col>
                            <Col
                              span={3}
                              order={2}
                              style={{ paddingLeft: "3px" }}
                            >
                              <Button
                                htmlType="button"
                                onClick={clearState}
                              >
                                Clear
                              </Button>
                            </Col>
                          </Row>
                        </Form.Item>
                      </React.Fragment>
                    ) : null}
                  </div>
                ) : null}
                
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[
                    { required: true, message: "Please enter a name!" },
                    {
                      pattern: new RegExp(/^[a-zA-Z0-9:._ -]*$/),
                      message: "Please enter a valid name",
                    },
                  ]}
                >
                  <Input
                    id="file_name"
                    placeholder="Name"
                    disabled={!editingAllowed}
                    onChange={onChange}
                    className={!formState.enableEdit ? "read-only-input" : ""}
                  />
                </Form.Item>

                <Form.Item label="Description" name="description">
                  {formState.enableEdit ? (
                    <MarkdownEditor
                      id="description"
                      name="description"
                      targetDomId="fileDescr"
                      value={visualization.description}
                      disabled={!editingAllowed}
                      onChange={onChange}
                    />
                  ) : (
                    <div className="read-only-markdown">
                      {" "}
                      <ReactMarkdown
                        source={visualization.description}
                      />{" "}
                    </div>
                  )}
                </Form.Item>
            </Form>
          </TabPane> 
        </Tabs>  

        <div>
          {formState.dataAltered ?
            <div className="button-container">
              <Button key="submit" disabled={!editingAllowed} type="primary" loading={formState.confirmLoading} onClick={handleOk}>
                Save
              </Button>
            </div> : null}
            <div className="button-container">
              <Button key="back" onClick={handleCancel} type="primary" ghost>
                Cancel
              </Button> 
          </div> 
          
        </div>  
      </div>       
    </React.Fragment>
  )
}

export default VisualizationDetails;
