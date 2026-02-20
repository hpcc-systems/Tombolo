import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Form, Input, Select, DatePicker, Button, Row, Col } from 'antd';
import { handleError } from '@/components/common/handleResponse';
import dayjs from 'dayjs';

import { statuses } from './notificationUtil';
import { getUser } from '../../../common/userStorage';
import notificationsService from '@/services/notifications.service';
import asrService from '@/services/asr.service';

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

interface Props {
  displayCreateNotificationModal: boolean;
  setDisplayCreateNotificationModal: (v: boolean) => void;
  setSentNotifications: Dispatch<SetStateAction<any[]>>;
  setNotifications?: Dispatch<SetStateAction<any[]>>;
  monitorings: any[];
}

const CreateNotificationModal: React.FC<Props> = ({
  displayCreateNotificationModal,
  setDisplayCreateNotificationModal,
  setSentNotifications,
  monitorings,
}) => {
  const [savingForm, setSavingForm] = useState(false);
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedActivityType, setSelectedActivityType] = useState<any | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<any | null>(null);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [form] = Form.useForm();

  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const { user } = getUser();

  useEffect(() => {
    if (!selectedActivityType) return;
    (async () => {
      try {
        const data = await asrService.getDomains({ monitoringTypeId: selectedActivityType });
        setDomains(data);
      } catch (err) {
        handleError('Error fetching domains');
      }
    })();
  }, [selectedActivityType]);

  useEffect(() => {
    if (!selectedDomain) return;
    (async () => {
      try {
        const response = await asrService.getProductCategories({ domainId: selectedDomain });
        setProductCategories(response);
      } catch (err) {
        handleError('Failed to fetch product category for selected domain');
      }
    })();
  }, [selectedDomain]);

  const handleActivityChange = (value: any) => {
    setSelectedActivityType(value);
    setSelectedDomain(null);
    form.setFieldsValue({ domain: null, productCategory: null });
  };

  const handleDomainChange = async (value: any) => {
    try {
      setSelectedDomain(value);
      form.setFieldsValue({ productCategory: null });
    } catch (error) {
      handleError('Error fetching product category');
    }
  };

  const handleOk = async () => {
    try {
      setSavingForm(true);
      await form.validateFields();
    } catch (error) {
      setSavingForm(false);
      return;
    }

    try {
      const productCategoryShortCode = productCategories.find(
        c => c.id === form.getFieldValue('productCategory')
      ).shortCode;
      const commonPayloadFields: any = {
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

      const asrSpecificMetaData: any = {
        domain: form.getFieldValue('domain'),
        productCategory: form.getFieldValue('productCategory'),
        interceptionStage: form.getFieldValue('interceptionStage'),
        jiraTickets: form.getFieldValue('jiraTickets'),
      };

      const notificationPayload = { ...commonPayloadFields, metaData: { asrSpecificMetaData } };
      const responseData = await notificationsService.createNotification(notificationPayload);

      setSentNotifications(prevNotifications => [responseData, ...prevNotifications]);
      setSavingForm(false);
      setDisplayCreateNotificationModal(false);
      form.resetFields();
    } catch (error) {
      handleError('Error saving notification');
      setSavingForm(false);
    }
  };

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
                <Select placeholder="Select activity type" onChange={value => handleActivityChange(value)}>
                  {monitorings.map(a => (
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
                <Select placeholder="Select a domain" onChange={value => handleDomainChange(value)}>
                  {domains.map(domain => (
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
                  {productCategories.map(category => (
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
                  {interceptionStages.map(stage => (
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
                  {statuses.map(status => (
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
                  showCount
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
                  showCount
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
