import React from 'react';
import { Form, Row, Col, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import startCase from 'lodash/startCase';
import AsrSpecificFilters from './AsrSpecificFilters';

const { Option } = Select;

const MonitoringFilters: React.FC<any> = ({
  form,
  filtersVisible,
  onValuesChange,
  searchLabel = 'Monitoring Name',
  searchPlaceholder = 'Search by monitoring name',
  searchTerm,
  setSearchTerm,
  matchCount,
  showAsr = true,
  showClusters = false,
  clustersMode = 'multiple',
  showUsers = false,
  showFrequency = false,
  showCreators = false,
  options = {},
  integrations = [],
  handleDomainChange,
  className,
  labelClassName = 'notifications__filter_label',
}) => {
  const {
    approvalStatusOptions = [],
    activeStatusOptions = [],
    domainOptions = [],
    productOptions = [],
    clusterOptions = [],
    userOptions = [],
    frequencyOptions = [],
    creatorOptions = [],
  } = options || {};

  if (!filtersVisible) return null;

  return (
    <Form form={form} onValuesChange={onValuesChange} className={className}>
      <Row gutter={8}>
        <Col span={4}>
          <div className={labelClassName}>{searchLabel}</div>
          <Input
            placeholder={searchPlaceholder}
            prefix={<SearchOutlined />}
            suffix={
              searchTerm ? (
                <span style={{ color: matchCount > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                  {matchCount} match{matchCount > 1 ? 'es' : ''}{' '}
                </span>
              ) : (
                ''
              )
            }
            onChange={e => setSearchTerm?.(e.target.value.toLowerCase())}
            allowClear
            disabled={false}
          />
        </Col>

        <Col span={4}>
          <div className={labelClassName}>Approval Status</div>
          <Form.Item name="approvalStatus">
            <Select placeholder="Approval Status" allowClear disabled={false}>
              {approvalStatusOptions.map((s: any) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={4}>
          <div className={labelClassName}>Active Status</div>
          <Form.Item name="activeStatus">
            <Select placeholder="Active statuses" allowClear disabled={false}>
              {activeStatusOptions.map((a: any) => (
                <Option key={a} value={a}>
                  {a}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {showAsr && integrations?.some((i: any) => i.name === 'ASR') && (
          <AsrSpecificFilters
            integrations={integrations}
            domainOptions={domainOptions}
            productOptions={productOptions}
            handleDomainChange={handleDomainChange}
          />
        )}

        {showClusters && (
          <Col span={4}>
            <div className={labelClassName}>Clusters</div>
            <Form.Item name={clustersMode === 'single' ? 'cluster' : 'clusters'}>
              <Select
                placeholder={clustersMode === 'single' ? 'Cluster' : 'Clusters'}
                allowClear
                disabled={false}
                mode={clustersMode === 'multiple' ? 'multiple' : undefined}>
                {clusterOptions.map((c: any) => (
                  <Option key={c.id} value={c.id}>
                    {c.name || startCase(c.name)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        )}

        {showUsers && (
          <Col span={4}>
            <div className={labelClassName}>Users</div>
            <Form.Item name="users">
              <Select placeholder="Users" allowClear disabled={false} mode="multiple">
                {userOptions.map((u: any) => (
                  <Option key={u} value={u}>
                    {u}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        )}

        {showFrequency && (
          <Col span={4}>
            <div className={labelClassName}>Frequency</div>
            <Form.Item name="frequency">
              <Select placeholder="Frequency" allowClear disabled={false}>
                {frequencyOptions.map((f: any) => (
                  <Option key={f} value={f}>
                    {startCase(f)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        )}

        {showCreators && (
          <Col span={4}>
            <div className={labelClassName}>Created By</div>
            <Form.Item name="creator">
              <Select placeholder="Created By" allowClear disabled={false}>
                {creatorOptions.map((c: any) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>
    </Form>
  );
};

export default MonitoringFilters;
