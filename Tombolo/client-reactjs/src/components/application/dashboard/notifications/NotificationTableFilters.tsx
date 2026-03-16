import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, Row, Col, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

interface Props {
  setFilters: (f: any) => void;
  filters?: any;
  sentNotifications: any[];
  monitorings: any[];
  domains: any[];
  productCategories: any[];
}

const NotificationTableFilters: React.FC<Props> = ({
  setFilters,
  sentNotifications,
  monitorings,
  domains,
  productCategories,
}) => {
  const integrations = useSelector((state: any) => state.application.integrations);
  const [form] = Form.useForm();

  const [originOptions, setOriginOptions] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [domainOptions, setDomainOptions] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const past60Days = dayjs().subtract(60, 'days');

  useEffect(() => {
    const filterOptions: any = { origin: [], status: [], domain: [], product: [] };
    sentNotifications.forEach(notification => {
      const originName =
        monitorings.find(m => m.id === notification.notificationOrigin)?.name || notification.notificationOrigin;
      const domainName =
        domains.find(d => d.id === notification?.metaData?.asrSpecificMetaData?.domain)?.name ||
        notification?.metaData?.asrSpecificMetaData?.domain;
      const productCategoryName =
        productCategories.find(p => p.id === notification?.metaData?.asrSpecificMetaData?.productCategory)?.name ||
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

  const handleFormChange = (changedValues: any) => {
    setFilters((prev: any) => ({ ...prev, ...changedValues }));
  };

  return (
    <div className="notifications_filters__form">
      <Form form={form} onValuesChange={handleFormChange}>
        <Row gutter={16}>
          <Col span={5}>
            <div className="notifications__filter_label">Created Date Range</div>
            <Form.Item name="createdBetween">
              <DatePicker.RangePicker
                style={{ width: '100%' }}
                allowClear
                disabled={false}
                disabledDate={current =>
                  !current || current.isBefore(past60Days) || current.isAfter(dayjs().endOf('day'))
                }
              />
            </Form.Item>
          </Col>

          <Col span={5}>
            <div className="notifications__filter_label">Origin</div>
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
            <div className="notifications__filter_label">Status</div>
            <Form.Item name="status">
              <Select placeholder="Status" disabled={false} allowClear>
                {statusOptions.map((s, i) => (
                  <Option key={i} value={s}>
                    {s}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          {integrations.some((i: any) => i.name === 'ASR') && (
            <>
              <Col span={5}>
                <div className="notifications__filter_label">Domain</div>
                <Form.Item name="domain">
                  <Select placeholder="Domain" disabled={false} allowClear>
                    {domainOptions.map((d, i) => (
                      <Option key={i} value={d}>
                        {d}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={5}>
                <div className="notifications__filter_label">Product</div>
                <Form.Item name="product">
                  <Select placeholder="Product" disabled={false} allowClear>
                    {productOptions.map((p, i) => (
                      <Option key={i} value={p}>
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
};

export default NotificationTableFilters;
