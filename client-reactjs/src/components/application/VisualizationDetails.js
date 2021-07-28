import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { hasEditPermission } from "../common/AuthUtil.js";
import {
  Row,
  Col,
  Button,
  Form,
  Input,
  Select,
  Tabs,
  Spin,
  AutoComplete
} from "antd/lib";
const TabPane = Tabs.TabPane;
const Option = Select.Option;
const formItemLayout = {
  labelCol: { span: 2 },
  wrapperCol: { span: 8 },
};


function VisualizationDetails({ selectedGroup, openGroup, handleEditGroup, refreshGroups }) {
  const [form, setForm] = useState({
    initialDataLoading: false,
    fileSearchSuggestions: []
  });
  const [visualization, setVisualization] = useState({
    id: "",
    chartType: "table",
    url: "",
    title: "",
    name: ""
  });
  const editingAllowed = hasEditPermission(this.props.user);

  const assetReducer = useSelector((state) => state.assetReducer);
  const viewOnlyModeReducer = useSelector((state) => state.viewOnlyModeReducer);

  // view edit buttons on tabpane
  const editButton =
  !this.state.enableEdit && editingAllowed ? (
    <>
      <Button type="primary" onClick={makeFieldsEditable}>
        Edit
      </Button>
    </>
  ) : null;

  const viewChangesBtn = this.state.editing ? (
    <Button onClick={switchToViewOnly} type="primary" ghost>
      View Changes
    </Button>
  ) : null;

  const editandViewBtns = (
    <div>
      {editButton} {viewChangesBtn}
    </div>
  );

 
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
              <Spin spinning={form.initialDataLoading} size="large" />
            </div>
          ) : null}
          <Tabs defaultActiveKey="1" tabBarExtraContent={editandViewBtns}>
            <TabPane tab="Basic" key="1">
              <Form
                {...formItemLayout}
                labelAlign="left"
                ref={this.formRef}
                onFinish={this.handleOk}
              >
                {viewOnlyModeReducer.editMode ? (
                  <div>
                    {viewOnlyModeReducer.addingNewAsset ? (
                      <React.Fragment>
                        <Form.Item label="Cluster" name="clusters">
                          <Select
                            placeholder="Select a Cluster"
                            disabled={!editingAllowed}
                            onChange={this.onClusterSelection}
                            style={{ width: 190 }}
                          >
                            {this.props.clusters.map((cluster) => (
                              <Option key={cluster.id}>
                                {cluster.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

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
                                  this.searchFiles(value)
                                }
                                onSelect={(value) =>
                                  this.onFileSelected(value)
                                }
                                placeholder="Search files"
                                disabled={!editingAllowed}
                                notFoundContent={
                                  form.fileSearchSuggestions.length >
                                  0 ? (
                                    "Not Found"
                                  ) : (
                                    <Spin />
                                  )
                                }
                              >
                                {form.fileSearchSuggestions.map(
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
                                onClick={this.clearState}
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
                  label="Title"
                  name="title"
                  rules={[
                    { required: true, message: "Please enter a title!" },
                    {
                      pattern: new RegExp(/^[ a-zA-Z0-9:._-]*$/),
                      message: "Please enter a valid title. Title can have  a-zA-Z0-9:._- and space",
                    },
                  ]}
                >
                  <Input
                    id="file_title"
                    name="title"
                    onChange={this.onChange}
                    placeholder="Title"
                    disabled={!editingAllowed}
                    className={!this.state.enableEdit ? "read-only-input" : ""}
                  />
                </Form.Item>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[
                    { required: true, message: "Please enter a name!" },
                    {
                      pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
                      message: "Please enter a valid name",
                    },
                  ]}
                >
                  <Input
                    id="file_name"
                    onChange={this.onChange}
                    placeholder="Name"
                    disabled={disableReadOnlyFields || !editingAllowed}
                    className={!this.state.enableEdit ? "read-only-input" : ""}
                  />
                </Form.Item>
            </Form>
          </TabPane> 
        </Tabs>  
      </div>       
    </React.Fragment>
  )
}

export default VisualizationDetails;
