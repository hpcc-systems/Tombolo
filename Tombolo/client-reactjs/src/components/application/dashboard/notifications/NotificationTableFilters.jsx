// Packages
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, Row, Col, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';

// Local imports
import './notifications.css';

//Constants
const { Option } = Select;

function NotificationTableFilters({ setFilters, sentNotifications, monitorings, domains, productCategories }) {
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
  const past60Days = dayjs().subtract(60, 'days');

  //Effects
  useEffect(() => {
    const filterOptions = { origin: [], status: [], domain: [], product: [] };
    sentNotifications.forEach((notification) => {
      const originName =
        monitorings.find((m) => m.id === notification.notificationOrigin)?.name || notification.notificationOrigin;
      const domainName =
        domains.find((d) => d.id === notification?.metaData?.asrSpecificMetaData?.domain)?.name ||
        notification?.metaData?.asrSpecificMetaData?.domain;
      const productCategoryName =
        productCategories.find((p) => p.id === notification?.metaData?.asrSpecificMetaData?.productCategory)?.name ||
        notification?.metaData?.asrSpecificMetaData?.productCategory;
      filterOptions.origin = [...filterOptions.origin, originName];
      filterOptions.status = [...filterOptions.status, notification.status];
      filterOptions.domain = [...filterOptions.domain, domainName];
      filterOptions.product = [...filterOptions.product, productCategoryName];
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
              <DatePicker.RangePicker
                style={{ width: '100%' }}
                allowClear
                disabled={false}
                disabledDate={(current) =>
                  !current || current.isBefore(past60Days) || current.isAfter(dayjs().endOf('day'))
                }
              />
            </Form.Item>
          </Col>

          <Col span={5}>
            <div className="notifications__filter-label">Origin</div>
            <Form.Item name="origin">
              <Select placeholder="Origin" allowClear>
                {originOptions.map((o, i) => (
                  <Option key={i} value={o}>
                    {o}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <div className="notifications__filter-label">Status</div>
            <Form.Item name="status">
              <Select placeholder="Status" disabled={false} allowClear>
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
                  <Select placeholder="Domain" disabled={false} allowClear>
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
                  <Select placeholder="Product" disabled={false} allowClear>
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
