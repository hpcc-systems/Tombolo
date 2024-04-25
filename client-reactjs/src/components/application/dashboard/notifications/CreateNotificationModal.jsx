// Packages
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Form, Input, Select, DatePicker, Button, Row, Col, message } from 'antd';
import moment from 'moment';

// Local imports
import { getAllDomains, getProductCategories, getActivityTypes } from '../../../../api/fido';
import { createNotification } from './notificationUtil';
import { statuses } from './notificationUtil';

//Constants
const { Option } = Select;
const { TextArea } = Input;

const interceptionStages = [
  'Scrubs',
  'System Stability',
  'Build',
  'Code Merge',
  'Indexes/Extracts',
  'Data Management',
  'Base/Output',
];

const CreateNotificationModal = ({
  displayCreateNotificationModal,
  setDisplayCreateNotificationModal,
  setSentNotifications,
}) => {
  // Local states
  const [savingForm, setSavingForm] = useState(false);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [allActivityTypes, setAllActivityTypes] = useState([]);
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [productCategories, setProductCategories] = useState([]);
  const [form] = Form.useForm();

  // Redux
  const {
    applicationReducer: {
      application: { applicationId },
    },
    authenticationReducer: { user },
  } = useSelector((state) => state);

  // Get all domains
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllDomains();
        setDomains(data);
      } catch (err) {
        message.error('Error fetching domains');
      }
    })();
  }, []);

  // When domain changes, get activity types related to the domain
  useEffect(() => {
    if (!selectedDomain) return;

    (async () => {
      try {
        const data = await getActivityTypes({ domainId: selectedDomain });
        setAllActivityTypes(data);
      } catch (err) {
        message.error('Error fetching activity types');
      }
    })();
  }, [selectedDomain]);

  // Handle domain change
  const handleDomainChange = async (value) => {
    try {
      form.setFieldsValue({ productCategory: undefined, origin: undefined });
      setSelectedDomain(value);
    } catch (error) {
      message.error('Error fetching product category');
    }
  };

  //Handle when activity type changes
  useEffect(() => {
    (async () => {
      try {
        form.setFieldsValue({ productCategory: undefined });
        const data = await getProductCategories({ domainId: selectedDomain, activityTypeId: selectedActivityType });
        setProductCategories(data);
      } catch (err) {
        message.error('Error fetching product categories');
      }
    })();
  }, [selectedActivityType]);

  // Save new notification
  const handleOk = async () => {
    //Validate from fields
    try {
      setSavingForm(true);
      await form.validateFields();
    } catch (error) {
      setSavingForm(false);
      return;
    }

    //If form fields are valid proceed to save
    try {
      // Notification common payload fields
      const commonPayloadFields = {
        applicationId,
        searchableNotificationId: `${form.getFieldValue('productCategory')}_${moment().format(
          'YYYYMMDD_HHmmss_SSS'
        )}_MANUAL`,
        notificationOrigin: form.getFieldValue('origin'),
        notificationChannel: 'none',
        notificationTitle: form.getFieldValue('notificationTitle'),
        notificationDescription: form.getFieldValue('issueDescription'),
        status: form.getFieldValue('status'),
        resolutionDate: form.getFieldValue('resolutionDate'),
        createdBy: { name: `${user?.firstName} ${user?.lastName}`, email: user?.email, id: user?.id },
        comment: form.getFieldValue('comment'),
      };

      // ASR specific metadata
      const asrSpecificMetaData = {
        domain: form.getFieldValue('domain'),
        productCategory: form.getFieldValue('productCategory'),
        interceptionStage: form.getFieldValue('interceptionStage'),
        jiraTickets: form.getFieldValue('jiraTickets'),
      };

      //Make fetch call to save data
      const notificationPayload = { ...commonPayloadFields, metaData: { asrSpecificMetaData } };
      const responseData = await createNotification({ notificationPayload });

      // Successful creation of notification
      setSentNotifications((prevNotifications) => [responseData, ...prevNotifications]);
      setSavingForm(false);
      setDisplayCreateNotificationModal(false);
      form.resetFields();
    } catch (error) {
      // Error saving notification
      message.error('Error saving notification');
      setSavingForm(false);
    }
  };

  // handle cancel
  const handleCancel = () => {
    form.resetFields();
    setSavingForm(false);
    setDisplayCreateNotificationModal(false);
  };

  return (
    <div>
      <Modal
        width={800}
        open={displayCreateNotificationModal}
        title={<span>New Notification</span>}
        onOk={handleOk}
        onCancel={handleCancel}
        footerStyle={{ marginTop: '20px', background: 'red' }}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Close
          </Button>,
          <Button key="submit" type="primary" loading={savingForm} onClick={handleOk}>
            Save
          </Button>,
        ]}>
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="notificationTitle"
                label="Title"
                required
                rules={[
                  { required: true, message: 'Title is required' },
                  { max: 150, message: 'Max length is 150 characters' },
                ]}>
                <Input placeholder="Notification title" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="domain"
                label="Domain"
                required
                rules={[{ required: true, message: 'Domain is required' }]}>
                <Select placeholder="Select a domain" onChange={handleDomainChange}>
                  {domains.map((domain) => (
                    <Option key={domain.Domain} value={domain.Domain}>
                      {domain['Domain Name']}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="origin"
                label="Activity Type"
                required
                rules={[{ required: true, message: 'Activity type is required' }]}>
                <Select placeholder="Select activity type" onChange={(value) => setSelectedActivityType(value)}>
                  {allActivityTypes.map((a) => (
                    <Option key={a['Activity ID']} value={a['Activity ID']}>
                      {a['Activity Type']}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productCategory"
                label="Product Category"
                required
                rules={[{ required: true, message: 'Category is required' }]}>
                <Select placeholder="Select a product category">
                  {productCategories.map((category) => (
                    <Option key={category.value} value={category.value}>
                      {category.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="interceptionStage"
                label="Interception Stage"
                required
                rules={[{ required: true, message: 'Interception stage is required' }]}>
                <Select placeholder="Select an interception stage">
                  {interceptionStages.map((stage) => (
                    <Option key={stage} value={stage}>
                      {stage}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select placeholder="Select a status">
                  {statuses.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dateLogged"
                label="Date Logged"
                required
                rules={[{ required: true, message: 'Date logged is required' }]}>
                <DatePicker showTime={{ format: 'hh:mm A' }} format="dddd MMM DD hh:mm A" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="jiraTickets" label="Jira Tickets">
                <Select mode="tags" placeholder="Ticket numbers - coma separated" tokenSeparators={[',']} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="resolutionDate" label="Resolution Date">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="issueDescription"
                label="Issue Description"
                required
                rules={[
                  { required: true, message: 'Description is required' },
                  { max: 400, message: 'Maximum length is 400 characters' },
                ]}>
                <TextArea
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  style={{ resize: 'none' }}
                  className="tiny-scroll-bar"
                  showCount={true}
                  maxLength={400}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="comment"
                label="Comments"
                rules={[{ max: 400, message: 'Maximum length is 400 characters' }]}>
                <TextArea
                  rows={1}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  style={{ resize: 'none' }}
                  showCount={true}
                  maxLength={400}
                  className="tiny-scroll-bar"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CreateNotificationModal;
