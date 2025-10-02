// Packages
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Form, Input, Select, DatePicker, Button, Row, Col, message } from 'antd';
import dayjs from 'dayjs';

// Local imports
import { getDomains, getProductCategories } from './notificationUtil';
import { createNotification } from './notificationUtil';
import { statuses } from './notificationUtil';
import { getUser } from '../../../common/userStorage';

//Constants
const { Option } = Select;
const { TextArea } = Input;

// Interception stages
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
  monitorings,
}) => {
  // Local states
  const [savingForm, setSavingForm] = useState(false);
  const [domains, setDomains] = useState([]);
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [productCategories, setProductCategories] = useState([]);
  const [form] = Form.useForm();

  // Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);

  // Get user from local storage
  const { user } = getUser();

  // Effect - Get related domains when activity type is changed
  useEffect(() => {
    if (!selectedActivityType) {
      return;
    }
    (async () => {
      try {
        const data = await getDomains({ monitoringId: selectedActivityType });
        setDomains(data);
      } catch (err) {
        message.error('Error fetching domains');
      }
    })();
  }, [selectedActivityType]);

  // Effect - Get related product categories when domain is changed
  useEffect(() => {
    if (!selectedDomain) {
      return;
    }
    (async () => {
      try {
        const response = await getProductCategories({ domainId: selectedDomain });
        setProductCategories(response);
      } catch (err) {
        message.error('Failed to fetch product category for selected domain');
      }
    })();
  }, [selectedDomain]);

  // Handle activity change
  const handleActivityChange = (value) => {
    setSelectedActivityType(value);
    setSelectedDomain(null);
    form.setFieldsValue({ domain: null, productCategory: null });
  };

  // Handle domain change
  const handleDomainChange = async (value) => {
    try {
      setSelectedDomain(value);
      form.setFieldsValue({ productCategory: null });
    } catch (error) {
      message.error('Error fetching product category');
    }
  };

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
      const productCategoryShortCode = productCategories.find(
        (c) => c.id === form.getFieldValue('productCategory')
      ).shortCode;
      const commonPayloadFields = {
        applicationId,
        searchableNotificationId: `${productCategoryShortCode}_${dayjs().format('YYYYMMDD_HHmmss_SSS')}_MANUAL`,
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

  // JSX
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
        <Form layout="vertical" form={form} style={{ marginBottom: '30px' }}>
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
                name="origin"
                label="Activity Type"
                required
                rules={[{ required: true, message: 'Activity type is required' }]}>
                <Select placeholder="Select activity type" onChange={(value) => handleActivityChange(value)}>
                  {monitorings.map((a) => (
                    <Option key={a.id} value={a.id}>
                      {a.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="domain"
                label="Domain"
                required
                rules={[{ required: true, message: 'Domain is required' }]}>
                <Select placeholder="Select a domain" onChange={(value) => handleDomainChange(value)}>
                  {domains.map((domain) => (
                    <Option key={domain.id} value={domain.id}>
                      {domain.name}
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
                    <Option key={category.id} value={category.id}>
                      {`${category.name} (${category.shortCode})`}
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
                <DatePicker showTime={{ format: 'hh:mm' }} format="HH:mm" style={{ width: '100%' }} />
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
                <DatePicker showTime={{ format: 'hh:mm' }} format="HH:mm" style={{ width: '100%' }} />
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
