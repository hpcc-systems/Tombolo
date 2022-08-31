import React, { useEffect, useState } from 'react';
import { Button, message, Tabs, Row, Col, Modal, Form, Input, Select } from 'antd';
import { withRouter, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { authHeader } from '../../common/AuthHeader';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

//message config
message.config({
  top: 100,
  duration: 2,
  maxCount: 1,
});

function ManualJobDetail() {
  const [jobDetails, setJobDetails] = useState({});
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation(['common', 'job']); // t for translate -> getting namespaces relevant to this file
  const { applicationId, jobId, jobExecutionId } = useParams(); // Getting  from url params

  //Form ref
  const [form] = Form.useForm();

  useEffect(() => {
    getJobDetails(); // Get Job detail when component mounts
  }, []);

  //Get Job Details
  const getJobDetails = async () => {
    const jobDetailResponse = await fetch(`/api/job/job_details?app_id=${applicationId}&job_id=${jobId}`, {
      headers: authHeader(),
    });
    if (jobDetailResponse.ok) {
      const data = await jobDetailResponse.json();
      setJobDetails(data);
    } else {
      message.error('Unable to fetch job details');
    }
  };

  //When user clicks approve or reject btn
  const handleResponse = async () => {
    await form.validateFields();
    setShowModal(false);
    const { action, responseMessage } = form.getFieldsValue();
    try {
      const response = await fetch('/api/job/manualJobResponse', {
        headers: authHeader(),
        method: 'POST',
        body: JSON.stringify({
          jobExecutionId: jobExecutionId,
          status: action === 'approved' ? 'completed' : 'failed',
          manualJob_metadata: {
            response: action,
            responseMessage,
            respondedOn: Date.now(),
          },
        }),
      });

      if (response.ok) {
        message.success(' Your response has been saved');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        throw Error('Error occurred while saving your response. Please try again');
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  //When user clicks cancel button
  const handleCancel = () => {};

  //Button styles
  const actionBtnsStyle = { marginLeft: '10px' };

  //Buttons on tab pane
  const actions = (
    <div>
      <Button
        style={actionBtnsStyle}
        type="primary"
        onClick={() => {
          setShowModal(true);
        }}>
        Take Action
      </Button>
      <Button style={actionBtnsStyle} type="primary" ghost onClick={handleCancel}>
        Cancel
      </Button>
    </div>
  );
  //Job details
  const jobData = [
    { label: 'Title', value: jobDetails.title },
    { label: 'Name', value: jobDetails.name },
    { label: 'Job Type', value: jobDetails.jobType },
    { label: 'Contact', value: jobDetails.contact },
    { label: 'Created', value: jobDetails.createdAt },
  ];

  return (
    <div>
      <div className="assetTitle">
        {t('Job', { ns: 'common' })}: {jobDetails.name}
      </div>
      <Tabs tabBarExtraContent={actions}>
        <TabPane tab={t('Basic', { ns: 'common' })} key="1">
          {jobData.map((item, i) => (
            <Row id={i} gutter={{ xs: 8, sm: 8, md: 8, lg: 8 }} key={item.label}>
              <Col className="gutter-row" span={6}>
                <div>{item.label}</div>
              </Col>
              <Col className="gutter-row" span={18}>
                <div>{item.value}</div>
              </Col>
            </Row>
          ))}
        </TabPane>
      </Tabs>

      <Modal visible={showModal} closable={false} onCancel={() => setShowModal(false)} onOk={handleResponse}>
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Action"
            rules={[
              {
                required: true,
                message: 'Please select an option!',
              },
            ]}
            name="action">
            <Select placeholder="Select an action" allowClear>
              <Option value="approved">Approve</Option>
              <Option value="rejected">Reject</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Message" style={{ marginTop: '18px' }} name="responseMessage">
            <TextArea autoSize={{ minRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default withRouter(ManualJobDetail);
