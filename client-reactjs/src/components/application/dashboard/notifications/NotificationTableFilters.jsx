// Packages
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, Row, Col, DatePicker, Select } from 'antd';

// Local imports
import './notifications.css';

//Constants
const { Option } = Select;

function NotificationTableFilters({ setFilters, sentNotifications }) {
  //Redux
  const {
    applicationReducer: { integrations },
  } = useSelector((state) => state);

  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [originOptions, setOriginOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  //Effects
  useEffect(() => {
    const filterOptions = { origin: [], status: [], domain: [], product: [] };
    sentNotifications.forEach((notification) => {
      filterOptions.origin = [...filterOptions.origin, notification.notificationOrigin];
      filterOptions.status = [...filterOptions.status, notification.status];
      filterOptions.domain = [...filterOptions.domain, notification?.metaData?.asrSpecificMetaData?.domain];
      filterOptions.product = [...filterOptions.product, notification?.metaData?.asrSpecificMetaData?.productCategory];
    });

    setOriginOptions([...new Set(filterOptions.origin)]);
    setStatusOptions([...new Set(filterOptions.status)]);
    setDomainOptions([...new Set(filterOptions.domain)]);
    setProductOptions([...new Set(filterOptions.product)]);
  }, [sentNotifications]);

  // When the filter item changes
  const handleFormChange = (changedValues) => {
    setFilters((prev) => {
      return { ...prev, ...changedValues };
    });
  };

  //JSX
  return (
    <div className="notifications_filters__form">
      <Form form={form} onValuesChange={handleFormChange}>
        <Row gutter={16}>
          <Col span={5}>
            <div className="notifications__filter-label">Created Date Range</div>
            <Form.Item name="createdBetween">
              <DatePicker.RangePicker style={{ width: '100%' }} allowClear />
            </Form.Item>
          </Col>

          <Col span={5}>
            <div className="notifications__filter-label">Origin</div>
            <Form.Item name="origin">
              <Select placeholder="Origin" allowClear>
                {originOptions.map((o) => (
                  <Option key={o} value={o}>
                    {o}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <div className="notifications__filter-label">Status</div>
            <Form.Item name="status">
              <Select placeholder="Status" allowClear>
                {statusOptions.map((s) => (
                  <Option key={s} value={s}>
                    {s}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          {integrations.some((i) => i.name === 'ASR') && (
            <>
              <Col span={5}>
                <div className="notifications__filter-label">Domain</div>
                <Form.Item name="domain">
                  <Select placeholder="Domain" allowClear>
                    {domainOptions.map((d) => (
                      <Option key={d} value={d}>
                        {d}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={5} name="product">
                <div className="notifications__filter-label">Product</div>
                <Form.Item name="product">
                  <Select placeholder="Product" allowClear>
                    {productOptions.map((p) => (
                      <Option key={p} value={p}>
                        {p}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
      </Form>
    </div>
  );
}

export default NotificationTableFilters;
