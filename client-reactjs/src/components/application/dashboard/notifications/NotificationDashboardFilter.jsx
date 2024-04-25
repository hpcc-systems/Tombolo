/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable unused-imports/no-unused-imports */
// Package imports
import React, { useState } from 'react';
import { Dropdown, DatePicker, Menu, Button, Slider, Modal, Drawer } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import moment from 'moment';

const NotificationDashboardFilter = ({ dashBoardFilter, setDashBoardFilter }) => {
  const [visible, setVisible] = useState(false);

  // When menu item is clicked
  const handleMenuClick = (e) => {
    if (e.key === 'days') {
      setDashBoardFilter((prev) => ({ ...prev, filterBy: 'days', filterLabel: `Last ${dashBoardFilter.days} days` }));
    }
    if (e.key === 'range' && dashBoardFilter.range[0] && dashBoardFilter.range[1]) {
      setDashBoardFilter((prev) => ({
        ...prev,
        filterBy: 'range',
        filterLabel: `${moment(dashBoardFilter.range[0]).format('MM/DD/YY')} - ${moment(
          dashBoardFilter.range[1]
        ).format('MM/DD/YY')}`,
      }));
    }
  };

  // When slider value is changed
  const handleNumberChange = (value) => {
    setDashBoardFilter((prev) => ({
      ...prev,
      days: value,
      filterBy: 'days',
      filterLabel: `Last ${value === 1 ? '24 hours' : `${value} days`}`,
    }));
  };

  // When date range is changed
  const handleDateChange = (dates) => {
    if (!dates) {
      return;
    }
    const startDate = dates[0].format('MM/DD/YY');
    const endDate = dates[1].format('MM/DD/YY');
    setDashBoardFilter((prev) => ({
      ...prev,
      range: dates,
      filterBy: 'range',
      filterLabel: `${startDate} - ${endDate}`,
    }));
  };

  // When dropdown is opened or closed
  const handleVisibleChange = (flag) => {
    setVisible(flag);
  };

  // Disable all dates after today
  const disableFutureDates = (current) => {
    return current && current > moment().endOf('day');
  };

  // Menu
  const menu = (
    <Menu onClick={handleMenuClick} style={{ width: '400px' }}>
      <Menu.Item key="days">
        <div style={{ fontWeight: 'bold' }}>Days</div>
        <Slider
          size="small"
          defaultValue={dashBoardFilter.days}
          min={1}
          max={60}
          keyboard={true}
          trackStyle={{ backgroundColor: 'var(--primary)' }}
          autoFocus={true}
          onChange={handleNumberChange}
          tooltip={{
            open: visible,
            formatter: (value) => `${value}`,
            size: 'small',
          }}
        />
      </Menu.Item>
      <Menu.Item key="range">
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}> Range </div>
        <DatePicker.RangePicker
          defaultValue={dashBoardFilter.range}
          onChange={handleDateChange}
          disabledDate={disableFutureDates}
          style={{ width: '100%' }}
        />
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      {/* <Dropdown overlay={menu} onOpenChange={handleVisibleChange} open={visible}>
        <Button type="primary" ghost onClick={(e) => e.preventDefault()}>
          <>
            {dashBoardFilter.filterLabel}
            <span style={{ marginLeft: '10px' }}>
              <FilterOutlined />
            </span>
          </>
        </Button>
      </Dropdown> */}
      <Button
        type="primary"
        ghost
        icon={<FilterOutlined />}
        onClick={() => {
          setVisible(true);
        }}>
        {dashBoardFilter.filterLabel}
      </Button>
      <Modal
        open={visible}
        mask={false}
        maskClosable={true}
        footer={null}
        closable={false}
        // closeIcon={null}
        onCancel={() => setVisible(false)}
        style={{
          top: '100px',
          right: '20px',
          position: 'absolute',
        }}>
        <>
          <div style={{ fontWeight: 'bold' }}>Days</div>
          <Slider
            size="small"
            defaultValue={dashBoardFilter.days}
            min={1}
            max={60}
            keyboard={true}
            trackStyle={{ backgroundColor: 'var(--primary)' }}
            autoFocus={true}
            onChange={handleNumberChange}
            tooltip={{
              open: visible,
              formatter: (value) => `${value}`,
              size: 'small',
            }}
          />
        </>
        <>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}> Range </div>
          <DatePicker.RangePicker
            defaultValue={dashBoardFilter.range}
            onChange={handleDateChange}
            disabledDate={disableFutureDates}
            style={{ width: '100%' }}
          />
        </>
      </Modal>
    </>
  );
};

export default NotificationDashboardFilter;
