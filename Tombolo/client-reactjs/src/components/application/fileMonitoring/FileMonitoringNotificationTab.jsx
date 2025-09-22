// Packages
import React, { useEffect } from 'react';
import { Form, InputNumber, Select, Row, Col } from 'antd';

// Local Imports
import NotificationContacts from '../../common/Monitoring/NotificationContacts';

// Constants
const { Option } = Select;

const notificationConditions = {
  stdLogicalFile: [{ label: 'File size not in range', value: 'sizeNotInRange' }],
  superFile: [
    { label: 'Subfile count not in range', value: 'subFileCountNotInRange' },
    { label: 'Total size not in range', value: 'sizeNotInRange' },
  ],
};

const storageUnits = [
  { id: 0, label: 'MB', value: 'MB' },
  { id: 1, label: 'GB', value: 'GB' },
  { id: 2, label: 'TB', value: 'TB' },
  { id: 3, label: 'PB', value: 'PB' },
];

// Convert storage values to MB for comparison
export const convertToMB = (value, unit) => {
  const multipliers = { MB: 1, GB: 1024, TB: 1024 * 1024, PB: 1024 * 1024 * 1024 };
  return value * (multipliers[unit] || 1);
};

function FileMonitoringNotificationTab({
  form,
  monitoringFileType,
  selectedNotificationCondition,
  setSelectedNotificationCondition,
  isEditing,
  isDuplicating,
  setMinSizeThresholdUnit,
  setMaxSizeThresholdUnit,
  minSizeThresholdUnit,
  maxSizeThresholdUnit,
}) {
  // Reset fields when monitoringFileType changes
  useEffect(() => {
    if (isEditing || isDuplicating) {
      return;
    }
    // setSelectedNotificationCondition([]);
    form.setFieldsValue({
      notificationCondition: [],
      minFileSize: null,
      maxFileSize: null,
      minSubFileCount: null,
      maxSubFileCount: null,
    });
  }, [monitoringFileType]);

  // Handle Threshold Unit Change, re calulate and set error if min is greater than max and vice versa
  const handleThresholdUnitChange = (value, field) => {
    if (field === 'minThreshold') {
      setMinSizeThresholdUnit(value);
      // Calculate min and max in MB
      const minInMB = convertToMB(form.getFieldValue('minFileSize'), value);
      const maxInMB = convertToMB(form.getFieldValue('maxFileSize'), maxSizeThresholdUnit);

      // Set error if min is greater than max
      if (minInMB > maxInMB) {
        form.setFields([
          {
            name: 'minFileSize',
            errors: ['Minimum size cannot be greater than maximum size'],
          },
        ]);
      } else {
        // remoe error if exists
        form.setFields([
          {
            name: 'minFileSize',
            errors: [],
          },
        ]);
      }
    } else if (field === 'maxThreshold') {
      setMaxSizeThresholdUnit(value);
      // Calculate min and max in MB
      const minInMB = convertToMB(form.getFieldValue('minFileSize'), minSizeThresholdUnit);
      const maxInMB = convertToMB(form.getFieldValue('maxFileSize'), value);

      // Set error if min is greater than max
      if (minInMB > maxInMB) {
        form.setFields([
          {
            name: 'maxFileSize',
            errors: ['Maximum size cannot be smaller than minimum size'],
          },
          {
            name: 'minFileSize',
            errors: [],
          },
        ]);
      } else {
        // remove  error if exists
        form.setFields([
          {
            name: 'maxFileSize',
            errors: [],
          },
          {
            name: 'minFileSize',
            errors: [],
          },
        ]);
      }
    }
  };

  // Threshold Addons
  const renderThresholdAddon = (field) => (
    <Form.Item noStyle name={field === 'minThreshold' ? 'minSizeThresholdUnit' : 'maxSizeThresholdUnit'}>
      <Select
        // defaultValue={field === 'minThreshold' ? minSizeThresholdUnit : maxSizeThresholdUnit}
        style={{ width: 80 }}
        onChange={(value) => handleThresholdUnitChange(value, field)}>
        {storageUnits.map((unit) => (
          <Option key={unit.id} value={unit.value}>
            {unit.label}
          </Option>
        ))}
      </Select>
    </Form.Item>
  );

  return (
    <>
      <NotificationContacts form={form}>
        <Form.Item
          name="notificationCondition"
          label="Notify when"
          rules={[{ required: true, message: 'Select one or more options' }]}>
          <Select
            mode="multiple"
            placeholder="Select one"
            onChange={(value) => setSelectedNotificationCondition(value)}>
            {notificationConditions[monitoringFileType].map((status) => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* File Size Inputs */}
        {selectedNotificationCondition.includes('sizeNotInRange') && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="minFileSize"
                label="Minimum File Size"
                rules={[
                  { required: true, message: 'Enter minimum file size' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const max = getFieldValue('maxFileSize');
                      if (!value || !max) return Promise.resolve();

                      const minInMB = convertToMB(value, minSizeThresholdUnit);
                      const maxInMB = convertToMB(max, maxSizeThresholdUnit);

                      if (minInMB > maxInMB) {
                        return Promise.reject(new Error('Minimum size cannot be greater than maximum size'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}>
                <InputNumber style={{ width: '100%' }} addonAfter={renderThresholdAddon('minThreshold')} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="maxFileSize"
                label="Maximum File Size"
                rules={[
                  { required: true, message: 'Enter maximum file size' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const min = getFieldValue('minFileSize');
                      if (!value || !min) return Promise.resolve();

                      const minInMB = convertToMB(min, minSizeThresholdUnit);
                      const maxInMB = convertToMB(value, maxSizeThresholdUnit);

                      console.log('------------------------');
                      console.log(minSizeThresholdUnit, maxSizeThresholdUnit);
                      console.log(minInMB, maxInMB);
                      console.log('------------------------');

                      if (maxInMB < minInMB) {
                        return Promise.reject(new Error('Maximum size cannot be smaller than minimum size'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}>
                <InputNumber style={{ width: '100%' }} addonAfter={renderThresholdAddon('maxThreshold')} />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* Subfile Count Inputs */}
        {monitoringFileType === 'superFile' && selectedNotificationCondition.includes('subFileCountNotInRange') && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="minSubFileCount"
                label="Minimum Subfile Count"
                rules={[
                  { required: true, message: 'Enter minimum subfile count' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const max = getFieldValue('maxSubFileCount');
                      if (!value || !max) return Promise.resolve();

                      if (value > max) {
                        return Promise.reject(new Error('Minimum  count cannot be greater than maximum'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="maxSubFileCount"
                label="Maximum Subfile Count"
                rules={[
                  { required: true, message: 'Enter maximum subfile count' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const min = getFieldValue('minSubFileCount');
                      if (!value || !min) return Promise.resolve();

                      if (value < min) {
                        return Promise.reject(new Error('Maximum  count cannot be smaller than minimum'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        )}
      </NotificationContacts>
    </>
  );
}

export default FileMonitoringNotificationTab;
