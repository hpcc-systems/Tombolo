import React from 'react';
import { Form, Select, Input, InputNumber, Row, Col } from 'antd';

const { Option } = Select;

const daysOptions = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const buildStatuses = [
  { label: 'Build Available For Use', value: 'build_available_for_use' },
  { label: 'Discarded', value: 'discarded' },
  { label: 'Failed QA QAHeld', value: 'failed_qa_qaheld' },
  { label: 'Graveyard', value: 'graveyard' },
  { label: 'Passed QA', value: 'passed_qa' },
  { label: 'Passed QA No Release', value: 'passed_qa_no_release' },
  { label: 'Production', value: 'production' },
  { label: 'Skipped', value: 'skipped' },
];

function MonitoringTab({ form, _isEditing, _selectedMonitoring }) {
  return (
    <Form form={form} layout="vertical">
      <Form.Item
        label="Build Name"
        name="buildName"
        rules={[{ required: true, message: 'Please select or enter a build name' }]}>
        <Input placeholder="Enter build name" />
      </Form.Item>

      <Form.Item
        label="Notification Conditions"
        name={['monitoringData', 'notificationConditions']}
        rules={[{ required: true, message: 'Please select at least one notification condition' }]}>
        <Select mode="multiple" placeholder="Select notification conditions" optionLabelProp="label">
          <Option value="updateInterval" label="Build not following correct interval">
            Build not following correct interval
          </Option>
          <Option value="buildStatus" label="Build status">
            Build status
          </Option>
        </Select>
      </Form.Item>

      <Form.Item
        shouldUpdate={(prev, cur) =>
          (prev.monitoringData?.notificationConditions || []).join(',') !==
          (cur.monitoringData?.notificationConditions || []).join(',')
        }>
        {() => {
          const cond = form.getFieldValue(['monitoringData', 'notificationConditions']) || [];
          return (
            <>
              {cond.includes('updateInterval') && (
                <>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        label="Update Interval (days)"
                        name={['monitoringData', 'updateInterval']}
                        rules={[
                          {
                            // Only validate numeric constraints when a value is provided.
                            validator: (_, value) => {
                              if (value === undefined || value === null || value === '') {
                                return Promise.resolve();
                              }
                              if (typeof value !== 'number' || Number.isNaN(value)) {
                                return Promise.reject(new Error('Enter a valid number'));
                              }
                              if (value < 0) {
                                return Promise.reject(new Error('Enter a non-negative number'));
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}>
                        <InputNumber style={{ width: '100%' }} min={0} placeholder="Days between expected updates" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Update Interval Days"
                        name={['monitoringData', 'updateIntervalDays']}
                        help="Select allowed days of week for updates">
                        <Select mode="multiple" placeholder="Select days">
                          {daysOptions.map(d => (
                            <Option key={d} value={d}>
                              {d.charAt(0).toUpperCase() + d.slice(1)}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Cross-field validator: when updateInterval condition is selected, require at least one of
                      Update Interval (days) or Update Interval Days to be provided. This Form.Item is hidden
                      and only rendered when the condition is active so validation runs on submit. */}
                  <Form.Item
                    name={['monitoringData', '_updateInterval_required']}
                    rules={[
                      {
                        validator: () => {
                          const interval = form.getFieldValue(['monitoringData', 'updateInterval']);
                          const days = form.getFieldValue(['monitoringData', 'updateIntervalDays']);
                          const hasInterval = interval !== undefined && interval !== null && interval !== '';
                          const hasDays = Array.isArray(days) && days.length > 0;
                          if (hasInterval || hasDays) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error('Provide either Update Interval (days) or select Update Interval Days')
                          );
                        },
                      },
                    ]}>
                    <div />
                  </Form.Item>
                </>
              )}

              {cond.includes('buildStatus') && (
                <Form.Item
                  label="Build Status"
                  name={['monitoringData', 'buildStatus']}
                  rules={[{ required: true, message: 'Select at least one build status' }]}>
                  <Select mode="multiple" placeholder="Select build status(es)">
                    {buildStatuses.map(s => (
                      <Option key={s.value} value={s.value}>
                        {s.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            </>
          );
        }}
      </Form.Item>
    </Form>
  );
}

export default MonitoringTab;
