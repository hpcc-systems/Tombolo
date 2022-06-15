import { Button, Form, Radio, Select } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";

import "./AddJobsForm.css";

import { UpOutlined } from "@ant-design/icons";
import DebounceSelect from "./DebounceSelect";

const { Option } = Select;

const config = {
  jobTypes: ["Data Profile", "ETL", "Job", "Manual", "Query Publish", "Modeling", "Query Build", "Scoring", "Script", "Spray"],
  notRegularJobs:[ 'Manual','Spray','Script' ],
  layout: {
    tail: {
      wrapperCol: {
        offset: 3,
        xs: {
          span: 16,
        },
        xxl: {
          span: 10,
        },
      },
    },
  },
}

const SearchSettings = ({ form, panes, removeTab, addTab }) => {
  const { application } = useSelector((state) => ({
    application: state.applicationReducer,
  }));

  // References available clusters from redux store;
  const clusters = application.clusters;
  // Collapsing Search Setting div
  const [hide, setHide] = useState(false);
  const toggleHide = () => setHide((prev) => !prev);

  // reset jobtype to Job when selecting github job to avoid unexpected conflicts;
  const onSourceChange = (e) =>{  
    if (e.target.value) form.setFieldsValue({jobType:"Job"});
  }
  
  // Set isStoredOnGithub to false when adding Manual Job to avoid unexpected conflicts;
  const onJobTypeChange = (value) =>{  
    if (value === "Manual") form.setFieldsValue({isStoredOnGithub: false});
  }

  return (
    <fieldset className={`search-settings ${hide ? "hide-search" : ""} custom-scroll`}>
      <legend onClick={toggleHide} className="search-settings-legend">
        Search Settings <UpOutlined rotate={hide ? 180 : 0} />
      </legend>
      <Form.Item label="Job Type" name="jobType" required>
        <Select placeholder="Job Type" onChange={onJobTypeChange} >
          {config.jobTypes.map((type) => (
            <Option key={type}>{type}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Cluster" name="clusterId" required>
        <Select allowClear placeholder="Select a Cluster">
          {clusters.map((cluster) => (
            <Option key={cluster.id}>{cluster.name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Source" name="isStoredOnGithub">
        <Radio.Group onChange={onSourceChange} style={{ width: "100%", textAlign: "center" }} size="middle" buttonStyle="solid">
          <Radio.Button style={{ width: "50%" }} value={false}>
            HPCC
          </Radio.Button>
          <Radio.Button style={{ width: "50%" }} value={true}>
            GitHub
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item noStyle shouldUpdate>
        {() => {
          const { clusterId, isStoredOnGithub, jobType, search } = form.getFieldsValue(true);
          //  Show "Add Job" button or search field conditionally;
          if (isStoredOnGithub || config.notRegularJobs.includes(jobType)) {
            const value = isStoredOnGithub ? "GitHub Job" : jobType;
            const key = value + " #" + (panes.length + 1);
            return (
              <Form.Item {...config.layout.tail}>
                <Button type="ghost" block onClick={() => addTab({ key, value, clusterId, jobType, isStoredOnGithub })}>
                  Add Job
                </Button>
              </Form.Item>
            );
          }

          return (
            <Form.Item label="Find Jobs" name="addedJobs" hidden={jobType === "Spray"}>
              <DebounceSelect
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="Search by job's name"
                formValues={{ clusterId, jobType, search }}
                onDeselect={(_, { key: wuid }) => removeTab(wuid)}
                onSelect={(_, { key, value }) => addTab({ key, value, clusterId, jobType, isStoredOnGithub })}
              />
            </Form.Item>
          );
        }}
      </Form.Item>
    </fieldset>
  );
};

export default SearchSettings;