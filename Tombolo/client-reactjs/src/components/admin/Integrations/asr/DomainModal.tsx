import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Row, Col } from 'antd';
import { isEmail } from 'validator';
import { handleError, handleSuccess } from '../../../common/handleResponse';
import asrService from '@/services/asr.service';

const { Option } = Select;
const severityThresholds = [0, 1, 2, 3];
const regions = ['UK', 'USA'];

interface Props {
  domainModalOpen?: boolean;
  setDomainModalOpen?: (open: boolean) => void;
  monitoringTypes?: any[];
  setDomains?: (domains: any[]) => void;
  domains?: any[];
  selectedDomain?: any;
  setSelectedDomain?: (d: any) => void;
}

const DomainModal: React.FC<Props> = ({
  domainModalOpen,
  setDomainModalOpen,
  monitoringTypes = [],
  setDomains,
  domains = [],
  selectedDomain,
  setSelectedDomain,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedDomain) {
      let activityTypesIds = selectedDomain.activityTypes.map((d: any) => d.id);
      activityTypesIds = activityTypesIds.filter((id: any) => id !== null);
      form.setFieldsValue({
        name: selectedDomain.name,
        region: selectedDomain.region,
        severityThreshold: selectedDomain.severityThreshold,
        monitoringTypeIds: activityTypesIds,
        severityAlertRecipients: selectedDomain.severityAlertRecipients,
      });
    }
  }, [selectedDomain]);

  const saveUpdatedDomain = async () => {
    try {
      await form.validateFields();
    } catch (_err) {
      return;
    }

    try {
      const payload = form.getFieldsValue();
      await asrService.updateDomain({ id: selectedDomain.id, payload });
      const refreshed = await asrService.getAllDomains();
      setDomains && setDomains(refreshed);
      handleSuccess('Domain updated successfully');
      setSelectedDomain && setSelectedDomain(null);
      form.resetFields();
      setDomainModalOpen && setDomainModalOpen(false);
    } catch (_err) {
      handleError('Failed to update domain');
    }
  };

  const saveDomain = async () => {
    try {
      await form.validateFields();
    } catch (_err) {
      return;
    }

    const name = form.getFieldValue('name');
    const domainExists = domains.some((domain: any) => domain.name === name);
    if (domainExists) {
      handleError('Domain already exists');
      return;
    }

    try {
      const payload = form.getFieldsValue();
      await asrService.createDomain({ payload });
      const refreshed = await asrService.getAllDomains();
      setDomains && setDomains(refreshed);
      handleSuccess('Domain saved successfully');
      form.resetFields();
      setDomainModalOpen && setDomainModalOpen(false);
    } catch (_err) {
      handleError('Failed to save domain');
    }
  };

  const handleFromSubmission = () => {
    if (selectedDomain) saveUpdatedDomain();
    else saveDomain();
  };

  const handleCancel = () => {
    setSelectedDomain && setSelectedDomain(null);
    form.resetFields();
    setDomainModalOpen && setDomainModalOpen(false);
  };

  return (
    <Modal
      title={selectedDomain ? 'Edit Domain' : 'Add Domain'}
      open={domainModalOpen}
      onOk={handleFromSubmission}
      onCancel={handleCancel}
      width={800}
      okText={selectedDomain ? 'Update' : 'Save'}
      maskClosable={false}>
      <Form form={form} layout="vertical">
        <Row gutter={8}>
          <Col span={10}>
            <Form.Item
              label="Domain"
              name="name"
              rules={[{ required: true, message: 'Please input the product name!' }, { max: 100 }]}>
              <Input />
            </Form.Item>
          </Col>

          <Col span={7}>
            <Form.Item label="Region" name="region" rules={[{ required: true, message: 'Please Select a region' }]}>
              <Select>
                {regions.map(region => (
                  <Option key={region} value={region}>
                    {region}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={7}>
            <Form.Item
              label="Severity Threshold"
              rules={[{ required: true, message: 'Severity threshold is required' }]}
              name="severityThreshold">
              <Select>
                {severityThresholds.map(severity => (
                  <Option key={severity} value={severity}>
                    {severity}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Severity E-mail Recipients"
          name="severityAlertRecipients"
          required
          rules={[
            {
              validator: (_: any, value: any[]) => {
                if (!value || value.length === 0) return Promise.reject(new Error('Please add at least one email!'));
                if (value.length > 20) return Promise.reject(new Error('Too many emails'));
                if (!value.every((v: string) => isEmail(v)))
                  return Promise.reject(new Error('One or more emails are invalid'));
                return Promise.resolve();
              },
            },
          ]}>
          <Select
            mode="tags"
            allowClear
            placeholder="Enter a comma-delimited list of email addresses"
            tokenSeparators={[',']}
          />
        </Form.Item>

        <Form.Item label="Activity Type(s)" name="monitoringTypeIds" rules={[{ required: false }]}>
          <Select mode="multiple">
            {monitoringTypes.map((type: any) => (
              <Option key={type.id} value={type.id}>
                {type.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DomainModal;
