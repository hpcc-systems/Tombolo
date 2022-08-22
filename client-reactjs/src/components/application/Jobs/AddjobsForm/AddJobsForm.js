import React from 'react';
import { Col, Empty, Form, Row, Tabs, Tooltip } from 'antd';
import { useRef, useState } from 'react';

import './AddJobsForm.css';

import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import JobDetailsForm from '../JobDetails';
import SearchSettings from './SearchSettings';
import SaveAllJobsButton from './SaveAllJobs';

const { TabPane } = Tabs;

const config = {
  layout: {
    main: {
      labelCol: { span: 3 },
      wrapperCol: {
        xs: {
          span: 16,
        },
        xxl: {
          span: 10,
        },
      },
    },
  },
  status: {
    saved: (
      <Tooltip title="Job was successfully saved">
        <CheckCircleOutlined style={{ color: 'green' }} />
      </Tooltip>
    ),
    error: (
      <Tooltip title="Failed to save a job">
        <CloseCircleOutlined style={{ color: 'red' }} />
      </Tooltip>
    ),
    exists: (
      <Tooltip title="This job is already added">
        <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      </Tooltip>
    ),
  },
  initFormValues: {
    jobType: 'Job',
    addedJobs: [],
    isStoredOnGithub: false, // hpcc | github
    // clusterId: "", // if empty sting is provided then placeholder is not visible;
  },
};

const AddJobsForm = () => {
  const [form] = Form.useForm();

  const [activeKey, setActiveKey] = useState('');
  const [panes, setPanes] = useState([]);

  const jobDetailsList = useRef({});

  const onTabChange = (key) => setActiveKey(key);
  const onEdit = (targetKey, _action) => removeTab(targetKey);

  const addTab = ({ key, value, clusterId, jobType, isStoredOnGithub }) => {
    setPanes((prev) => [...prev, { key, value, status: '', clusterId, jobType, isStoredOnGithub }]);
    setActiveKey(key);
  };

  const removeTab = (key) => {
    let lastIndex = -1;
    // AntD`s magic to keep track of last opened tab when current tab is removed;
    panes.forEach((pane, i) => {
      if (pane.key === key) {
        lastIndex = i - 1;
      }
    });

    if (panes.length && activeKey === key) {
      let newActiveKey;

      if (lastIndex >= 0) {
        newActiveKey = panes[lastIndex].key;
      } else {
        newActiveKey = panes[0].key;
      }

      setActiveKey(newActiveKey);
    }

    // remove from useRef reference to removed tab;
    delete jobDetailsList.current[key];

    // Update "select" and panes list
    let removedPane;

    const newPanes = panes.filter((pane) => {
      if (pane.key === key) {
        removedPane = pane;
        return false;
      }
      return true;
    });
    // this will update tabs
    setPanes(newPanes);
    // this will update select
    const newAddedJobs = form.getFieldValue('addedJobs').filter((job) => job !== removedPane.value);
    form.setFieldsValue({ addedJobs: newAddedJobs });
  };

  const updateTab = ({ status, key }) => {
    setPanes((prev) =>
      prev.map((pane) => {
        if (pane.key === key) {
          pane.status = status;
        }
        return pane;
      })
    );
  };

  return (
    <div className="add-jobs-screen custom-scroll">
      {/*  SEARCH SETTINGS ROW */}
      <Row style={{ marginBottom: '20px' }}>
        <Col span={12}>
          <Form {...config.layout.main} form={form} name="multi-jobs" initialValues={config.initFormValues}>
            <SearchSettings form={form} panes={panes} addTab={addTab} removeTab={removeTab} />
          </Form>
        </Col>
      </Row>

      {/*  TABS ROW */}
      <Row style={{ flex: 1 }}>
        <Col span={24} className="tabs-container">
          <div className="card-container">
            {panes.length === 0 ? (
              <Empty description='Find a job in "Search Settings"' />
            ) : (
              <Tabs
                hideAdd
                onEdit={onEdit}
                type="editable-card"
                activeKey={activeKey}
                onChange={onTabChange}
                tabBarExtraContent={<SaveAllJobsButton jobDetailsList={jobDetailsList} />}>
                {panes.map((pane) => {
                  // if element ref established add ref to jobDetails list, otherwise do nothing;
                  const addRefToList = (element) => (element ? (jobDetailsList.current[pane.key] = element) : null);
                  return (
                    <TabPane
                      tab={
                        <>
                          {config.status[pane.status]} {pane.value}
                        </>
                      }
                      key={pane.key}>
                      <JobDetailsForm ref={addRefToList} inTabView={{ ...pane, updateTab }} />
                    </TabPane>
                  );
                })}
              </Tabs>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AddJobsForm;
