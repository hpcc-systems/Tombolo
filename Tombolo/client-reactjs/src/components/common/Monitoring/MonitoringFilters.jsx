// Packages
import React from 'react';
import { Form, Row, Col, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import startCase from 'lodash/startCase';

// Local imports
import AsrSpecificFilters from './AsrSpecificFilters';

const { Option } = Select;

/**
 * Shared, configurable filters form used across Monitoring pages (Cost, Cluster, Job, Landing Zone).
 * It renders a compact filters bar with a search input, approval/active status selects,
 * and optional ASR, Clusters, Users, and Frequency fields depending on flags.
 *
 * Visibility: the component returns null when filtersVisible is false (keeps DOM clean).
 * State management: callers typically use the useMonitoringFilters hook to supply form instance,
 * onValuesChange handler, and option arrays; this component is purely presentational.
 *
 * Props overview
 * @param {import('antd').FormInstance} form - Ant Design Form instance controlling the fields.
 * @param {boolean} filtersVisible - Whether to render the filters UI; if false, component returns null.
 * @param {(changedValues:any, allValues:any)=>void} onValuesChange - Form change handler (usually from useMonitoringFilters).
 * @param {string} [searchLabel="Monitoring Name"] - Label displayed above the search input.
 * @param {string} [searchPlaceholder="Search by monitoring name"] - Placeholder for the search input.
 * @param {string} searchTerm - Current free-text search term used to show match count suffix colorization.
 * @param {(value:string)=>void} setSearchTerm - Setter to update the search term in the parent; called with lower-cased input.
 * @param {number} matchCount - Number of matches used to render the suffix (and color) in the search input.
 *
 * Feature flags
 * @param {boolean} [showAsr=true] - If true and ASR integration is present, shows Domain/Product selects.
 * @param {boolean} [showClusters=false] - If true, shows a Cluster(s) select field.
 * @param {('single'|'multiple')} [clustersMode='multiple'] - Single-select uses field name 'cluster'; multi-select uses 'clusters'.
 * @param {boolean} [showUsers=false] - If true, shows a multi-select Users field.
 * @param {boolean} [showFrequency=false] - If true, shows a single-select Frequency field.
 * @param {boolean} [showCreators=false] - If true, shows a single-select Created By field.
 *
 * Options object (all arrays are optional; defaults to empty arrays)
 * @param {Object} [options] - Options providing choices for each select.
 * @param {string[]} [options.approvalStatusOptions] - Approval status values.
 * @param {string[]} [options.activeStatusOptions] - Active status values (e.g., "Active", "Inactive").
 * @param {{id:string|number,name:string}[]} [options.domainOptions] - Domain options used by ASR filters.
 * @param {{id:string|number,name:string}[]} [options.productOptions] - Product options used by ASR filters.
 * @param {{id:string|number,name:string}[]} [options.clusterOptions] - Cluster options.
 * @param {string[]} [options.userOptions] - User identifiers for the Users field.
 * @param {string[]} [options.frequencyOptions] - Frequencies (e.g., "daily", "weekly").
 * @param {{id:string|number,name:string}[]} [options.creatorOptions] - Creator options for Created By field.
 *
 * Misc
 * @param {{name:string}[]} [integrations=[]] - Integrations present; ASR UI is shown only if an item has name === 'ASR'.
 * @param {(domainId:string|number)=>void} handleDomainChange - Called when the ASR Domain changes.
 * @param {string} [className] - Additional className for the Form element.
 * @param {string} [labelClassName='notifications__filter_label'] - Class name used for labels above fields.
 */
function MonitoringFilters({
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
}) {
  const {
    approvalStatusOptions = [],
    activeStatusOptions = [],
    domainOptions = [],
    productOptions = [],
    clusterOptions = [],
    userOptions = [],
    frequencyOptions = [],
    creatorOptions = [],
  } = options;

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
              {approvalStatusOptions.map(s => (
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
              {activeStatusOptions.map(a => (
                <Option key={a} value={a}>
                  {a}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {showAsr && integrations?.some(i => i.name === 'ASR') && (
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
                {clusterOptions.map(c => (
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
                {userOptions.map(u => (
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
                {frequencyOptions.map(f => (
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
                {creatorOptions.map(c => (
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
}

export default MonitoringFilters;
